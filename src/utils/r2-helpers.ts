import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

import { r2Client } from './r2-client'

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!

/**
 * Sanitize a filename so it is safe to use as the last segment of an R2 key.
 * Strips path separators and colons, collapses whitespace, and falls back to
 * "file" if nothing remains.
 */
function sanitizeFileName(raw: string): string {
  const cleaned = raw
    .replace(/[/\\:]/g, '_') // replace path separators & colons
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim()
  return cleaned || 'file'
}

/**
 * Build the R2 object key for a user file.
 * Pattern: users/{userId}/{openaiFileId}/{sanitizedFilename}
 *
 * This layout makes it easy to:
 *  - list all files for a user  (prefix = users/{userId}/)
 *  - identify the OpenAI file ID from the key
 *  - preserve the original filename for re-uploads
 */
function buildObjectKey(
  userId: string,
  fileId: string,
  fileName: string
): string {
  return `users/${userId}/${fileId}/${sanitizeFileName(fileName)}`
}

/**
 * Upload a file to R2 as a backup.
 * Returns false on failure so the caller can roll back.
 */
export async function uploadFileToR2(
  userId: string,
  fileId: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<boolean> {
  try {
    const key = buildObjectKey(userId, fileId, fileName)

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    )

    console.log(`[r2] Uploaded ${key}`)
    return true
  } catch (error) {
    console.error(`[r2] Failed to upload file for user ${userId}:`, error)
    return false
  }
}

/**
 * Delete all crawl backups for a user from R2.
 * Removes everything under users/{userId}/crawl/.
 */
export async function deleteCrawlFromR2(userId: string): Promise<boolean> {
  try {
    const prefix = `users/${userId}/crawl/`

    const listed = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 10,
      })
    )

    const keys = listed.Contents?.map((obj) => obj.Key).filter(Boolean) ?? []

    if (keys.length === 0) {
      return true
    }

    await Promise.all(
      keys.map((key) =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          })
        )
      )
    )

    console.log(`[r2] Deleted ${keys.length} crawl backup(s) for user ${userId}`)
    return true
  } catch (error) {
    console.error(`[r2] Failed to delete crawl backups for user ${userId}:`, error)
    return false
  }
}

/**
 * Upload crawl content to R2 as a backup.
 * Pattern: users/{userId}/crawl/{sanitizedFilename}
 * Returns the R2 key on success, null on failure.
 */
export async function uploadCrawlToR2(
  userId: string,
  fileName: string,
  content: string
): Promise<string | null> {
  try {
    const prefix = `users/${userId}/crawl/`

    // Delete any existing crawl backups before uploading the new one
    const listed = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 10,
      })
    )

    const oldKeys =
      listed.Contents?.map((obj) => obj.Key).filter(Boolean) ?? []
    if (oldKeys.length > 0) {
      await Promise.all(
        oldKeys.map((key) =>
          r2Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
            })
          )
        )
      )
      console.log(
        `[r2] Deleted ${oldKeys.length} old crawl backup(s) under ${prefix}`
      )
    }

    const key = `${prefix}${sanitizeFileName(fileName)}`

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(content, 'utf-8'),
        ContentType: 'text/markdown',
      })
    )

    console.log(`[r2] Uploaded crawl backup ${key}`)
    return key
  } catch (error) {
    console.error(`[r2] Failed to upload crawl for user ${userId}:`, error)
    return null
  }
}

/**
 * Delete a single file from R2.
 * Requires the OpenAI file ID to locate the object.
 * Because we don't store the original filename separately, we list objects
 * with the prefix users/{userId}/{fileId}/ and delete whatever is there.
 */
export async function deleteFileFromR2(
  userId: string,
  fileId: string
): Promise<boolean> {
  try {
    const prefix = `users/${userId}/${fileId}/`

    const listed = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 10,
      })
    )

    const keys = listed.Contents?.map((obj) => obj.Key).filter(Boolean) ?? []

    if (keys.length === 0) {
      console.log(
        `[r2] No objects found for prefix ${prefix} — nothing to delete`
      )
      return true
    }

    // Usually exactly one object per fileId, but delete all matches to be safe
    await Promise.all(
      keys.map((key) =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          })
        )
      )
    )

    console.log(`[r2] Deleted ${keys.length} object(s) under ${prefix}`)
    return true
  } catch (error) {
    console.error(
      `[r2] Failed to delete file ${fileId} for user ${userId}:`,
      error
    )
    return false
  }
}

/**
 * Delete ALL files for a user from R2 (used when a user account is deleted).
 * Lists everything under the users/{userId}/ prefix and removes it.
 */
export async function deleteAllUserFilesFromR2(
  userId: string
): Promise<boolean> {
  try {
    const prefix = `users/${userId}/`
    let continuationToken: string | undefined
    let totalDeleted = 0

    // Paginate through all objects for this user
    do {
      const listed = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )

      const keys = listed.Contents?.map((obj) => obj.Key).filter(Boolean) ?? []

      if (keys.length > 0) {
        await Promise.all(
          keys.map((key) =>
            r2Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
              })
            )
          )
        )
        totalDeleted += keys.length
      }

      continuationToken = listed.IsTruncated
        ? listed.NextContinuationToken
        : undefined
    } while (continuationToken)

    console.log(`[r2] Deleted ${totalDeleted} object(s) for user ${userId}`)
    return true
  } catch (error) {
    console.error(`[r2] Failed to delete all files for user ${userId}:`, error)
    return false
  }
}

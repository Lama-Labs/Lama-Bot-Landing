import { clerkClient } from '@clerk/nextjs/server'
import { Uploadable } from 'openai/uploads'

import { openaiClient } from './openai-client'

/**
 * Get the vector store ID for a user from their private metadata
 */
export async function getUserVectorStoreId(
  userId: string
): Promise<string | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    if (!user) {
      console.error(`User not found: ${userId}`)
      return null
    }

    const vectorStoreId = user.privateMetadata?.vectorStoreId as
      | string
      | undefined
    return vectorStoreId || null
  } catch (error) {
    console.error(`Error getting vector store ID for user ${userId}:`, error)
    return null
  }
}

/**
 * Create a vector store for a user if one doesn't exist
 */
export async function ensureUserVectorStore(
  userId: string
): Promise<string | null> {
  try {
    // First check if user already has a vector store
    let vectorStoreId = await getUserVectorStoreId(userId)

    if (vectorStoreId) {
      return vectorStoreId
    }

    // Create a new vector store
    const vectorStoreName = `${userId}-vector-store`
    const vectorStore = await openaiClient.vectorStores.create({
      name: vectorStoreName,
    })

    vectorStoreId = vectorStore.id
    console.log(`Vector store created for user ${userId}: ${vectorStoreId}`)

    // Save the vector store ID to user's private metadata
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    if (user) {
      await client.users.updateUser(userId, {
        privateMetadata: {
          ...user.privateMetadata,
          vectorStoreId: vectorStoreId,
        },
      })
      console.log(
        `Vector store ID saved to private metadata for user ${userId}: ${vectorStoreId}`
      )
    }

    return vectorStoreId
  } catch (error) {
    console.error(`Error ensuring vector store for user ${userId}:`, error)
    return null
  }
}

/**
 * Upload a file to a user's vector store
 */
export async function uploadFileToVectorStore(
  userId: string,
  file: Uploadable,
  fileName: string
): Promise<string | null> {
  try {
    const vectorStoreId = await ensureUserVectorStore(userId)

    if (!vectorStoreId) {
      console.error(`No vector store found for user ${userId}`)
      return null
    }

    // Upload file to vector store
    const uploadedFile = await openaiClient.vectorStores.files.uploadAndPoll(
      vectorStoreId,
      file
    )

    // Prefer returning the underlying Files API id so downstream delete/list work consistently
    const returnedFileId =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (uploadedFile as any).file_id ?? (uploadedFile as any).id
    console.log(
      `File ${fileName} uploaded to vector store ${vectorStoreId} for user ${userId}`
    )
    return returnedFileId
  } catch (error) {
    console.error(
      `Error uploading file to vector store for user ${userId}:`,
      error
    )
    return null
  }
}

/**
 * Get all documents from a user's vector store
 */
export async function getUserVectorStoreDocuments(
  userId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | null> {
  try {
    const vectorStoreId = await getUserVectorStoreId(userId)

    if (!vectorStoreId) {
      console.error(`No vector store found for user ${userId}`)
      return null
    }

    // Get all vector store files
    const vsFiles = await openaiClient.vectorStores.files.list(vectorStoreId)

    // Map to underlying Files API objects to obtain original filename and unified timestamps
    const documents = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vsFiles.data.map(async (vsf: any) => {
        const fileId: string = vsf.file_id ?? vsf.id
        let filename: string | undefined = undefined
        let createdAtIso: string = new Date().toISOString()

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fileObj: any = await openaiClient.files.retrieve(fileId)
          filename = fileObj.filename
          const createdAtSec: number | undefined =
            fileObj.created_at ?? vsf.created_at
          if (typeof createdAtSec === 'number') {
            createdAtIso = new Date(createdAtSec * 1000).toISOString()
          }
        } catch (_e) {
          const fallbackSec: number | undefined = vsf.created_at
          if (typeof fallbackSec === 'number') {
            createdAtIso = new Date(fallbackSec * 1000).toISOString()
          }
        }

        return {
          id: fileId,
          status: vsf.status,
          createdAt: createdAtIso,
          name: filename,
        }
      })
    )

    console.log(
      `Retrieved ${documents.length} documents from vector store for user ${userId}`
    )
    return documents
  } catch (error) {
    console.error(
      `Error retrieving documents from vector store for user ${userId}:`,
      error
    )
    return null
  }
}

/**
 * Delete a file from a user's vector store
 */
export async function deleteFileFromVectorStore(
  userId: string,
  fileId: string
): Promise<boolean> {
  try {
    const vectorStoreId = await getUserVectorStoreId(userId)

    if (!vectorStoreId) {
      console.error(`No vector store found for user ${userId}`)
      return false
    }

    // only delete file if it belongs to the user's vector store
    const documents = await getUserVectorStoreDocuments(userId)
    if (!documents?.some((doc) => doc.id === fileId)) {
      console.error(
        `File ${fileId} does not belong to vector store ${vectorStoreId} for user ${userId}`
      )
      return false
    }

    // Delete file from files
    await openaiClient.files.delete(fileId)
    // Delete file from vector store
    await openaiClient.vectorStores.files.delete(fileId, {
      vector_store_id: vectorStoreId,
    })

    console.log(
      `File ${fileId} deleted from vector store ${vectorStoreId} for user ${userId}`
    )
    return true
  } catch (error) {
    console.error(
      `Error deleting file from vector store for user ${userId}:`,
      error
    )
    return false
  }
}

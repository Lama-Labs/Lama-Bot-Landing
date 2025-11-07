'use client'

import { LoadingButton } from '@mui/lab'
import {
  Alert,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'
import { FileText, Info, Trash2, Upload } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Document {
  id: string
  status: string
  createdAt: string
  name?: string
  sizeBytes: number
}

interface FileUploadResponse {
  success: boolean
  vectorStoreFileId: string
  fileName: string
}

const ManageFiles = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const t = useTranslations('dashboard.files')
  const locale = useLocale()
  const [filesLimit, setFilesLimit] = useState(0)
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)
  const [totalStorageLimit, setTotalStorageLimit] = useState<number>(0)

  const isLimitReached = filesLimit > 0 && documents.length >= filesLimit

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/vector-store/list')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setFilesLimit(data.filesLimit)
        setIsSubscribed(Boolean(data.isSubscribed))
        setTotalStorageLimit(data.totalStorageLimit)
        console.log(data.totalStorageLimit)
      } else if (response.status === 404) {
        setDocuments([])
        setError(t('errors.noVectorStore'))
      } else {
        setError(t('errors.fetchDocuments'))
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(t('errors.fetchDocuments'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/vector-store/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data: FileUploadResponse = await response.json()
        setDocuments((prev) => [
          ...prev,
          {
            id: data.vectorStoreFileId,
            name: data.fileName,
            status: 'completed',
            createdAt: new Date().toISOString(),
            sizeBytes: file.size,
          },
        ])
      } else {
        const errorText = await response.json()
        setError(errorText.error || t('errors.uploadFile'))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(t('errors.uploadFile'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (fileId: string) => {
    setDeleting(fileId)
    setError(null)
    try {
      const response = await fetch('/api/vector-store/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== fileId))
      } else {
        const errorText = await response.text()
        setError(errorText || t('errors.deleteFile'))
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      setError(t('errors.deleteFile'))
    } finally {
      setDeleting(null)
    }
  }

  // Removed status icons and chips for a leaner UI

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let value = bytes
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }
    const rounded =
      value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
    return `${rounded} ${units[unitIndex]}`
  }

  const usedBytes = documents.reduce((sum, doc) => {
    const size = doc.sizeBytes
    return sum + size
  }, 0)

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant='h6'>{t('title')}</Typography>
        <Tooltip title={t('tooltip')} placement='right' arrow>
          <IconButton size='small' sx={{ color: 'primary.main' }}>
            <Info size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        {loading ? (
          <Skeleton variant='text' width={160} height={20} />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            {documents.length}/{filesLimit}{' '}
            {t('counters.uploaded', { count: documents.length })}
            {totalStorageLimit > 0
              ? ` • ${formatBytes(Math.max(totalStorageLimit - usedBytes, 0))} available`
              : ''}
          </Typography>
        )}
        <>
          <input
            ref={fileInputRef}
            accept='.pdf,.txt,.doc,.docx'
            style={{ display: 'none' }}
            id='file-upload'
            type='file'
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Tooltip
            title={
              !isSubscribed
                ? t('tooltips.subscriptionRequired')
                : isLimitReached
                  ? t('tooltips.limitReached', { limit: filesLimit })
                  : ''
            }
            disableHoverListener={!(isLimitReached || !isSubscribed)}
            disableFocusListener={!(isLimitReached || !isSubscribed)}
            disableTouchListener={!(isLimitReached || !isSubscribed)}
            arrow
          >
            <span>
              <LoadingButton
                variant='contained'
                startIcon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
                disabled={uploading || isLimitReached || !isSubscribed}
              >
                {uploading ? t('status.uploading') : t('buttons.uploadFile')}
              </LoadingButton>
            </span>
          </Tooltip>
        </>
      </Box>

      {loading ? (
        <Skeleton variant='rectangular' height={200} />
      ) : documents.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FileText size={32} color='currentColor' style={{ opacity: 0.5 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='subtitle1' color='text.primary'>
              {t('empty.title')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('empty.subtitle')}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={1}>
          <List>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                divider
                secondaryAction={
                  <LoadingButton
                    loading={deleting === doc.id}
                    variant='outlined'
                    color='error'
                    size='small'
                    startIcon={<Trash2 size={16} />}
                    onClick={() => handleDelete(doc.id)}
                    disabled={doc.status !== 'completed' || uploading}
                  >
                    {t('actions.delete')}
                  </LoadingButton>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body1' color='text.secondary'>
                        {doc.name ||
                          `${t('documentLabel')} ${doc.id.slice(-8)}`}
                      </Typography>
                      {typeof doc.sizeBytes === 'number' && (
                        <Typography variant='body1'>
                          {formatBytes(doc.sizeBytes)}
                        </Typography>
                      )}
                      <Tooltip
                        title={t('tooltips.uploadedOn', {
                          date: formatDate(doc.createdAt),
                        })}
                        arrow
                      >
                        <IconButton
                          size='small'
                          sx={{ color: 'text.secondary' }}
                        >
                          <Info size={14} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  )
}

export default ManageFiles

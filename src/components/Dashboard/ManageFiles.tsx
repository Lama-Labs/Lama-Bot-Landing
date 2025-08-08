'use client'

import { LoadingButton } from '@mui/lab'
import {
  Alert,
  Box,
  Button,
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
import { useEffect, useRef, useState } from 'react'

interface Document {
  id: string
  status: string
  createdAt: string
  name?: string
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

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/vector-store/list')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else if (response.status === 404) {
        setDocuments([])
        setError('No vector store found. Upload your first file to create one.')
      } else {
        setError('Error fetching documents')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError('Error fetching documents')
    } finally {
      setLoading(false)
    }
  }

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
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
        ])
      } else {
        const errorText = await response.text()
        setError(errorText || 'Error uploading file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Error uploading file')
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
        setError(errorText || 'Error deleting file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      setError('Error deleting file')
    } finally {
      setDeleting(null)
    }
  }

  // Removed status icons and chips for a leaner UI

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant='h6'>Your Files</Typography>
        <Tooltip
          title='Manage your uploaded files that are used to train your AI chatbot. You can upload documents, delete them, and monitor their processing status.'
          placement='right'
          arrow
        >
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
        <Typography variant='body2' color='text.secondary'>
          {documents.length} file{documents.length !== 1 ? 's' : ''} uploaded
        </Typography>
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
          <Button
            variant='contained'
            startIcon={<Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload File'}
          </Button>
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
              No files uploaded yet
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Upload your first document to start training your AI chatbot
            </Typography>
          </Box>
          <Button
            size='small'
            variant='contained'
            startIcon={<Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Upload
          </Button>
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
                    disabled={doc.status !== 'completed'}
                  >
                    Delete
                  </LoadingButton>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body1'>
                        {doc.name || `Document ${doc.id.slice(-8)}`}
                      </Typography>
                      <Tooltip
                        title={`Uploaded on ${formatDate(doc.createdAt)}`}
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

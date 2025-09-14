'use client'

import type { UserResource } from '@clerk/types'
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'
import { Check, Copy, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

interface ApiKeyResponse {
  message: string
  apiKey: string | null
}

interface ApiKeySectionProps {
  user: UserResource | null | undefined
  isLoaded: boolean
}

const ApiKeySection = ({ user, isLoaded }: ApiKeySectionProps) => {
  const [apiKeyData, setApiKeyData] = useState<ApiKeyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const t = useTranslations('dashboard.apiKey')

  const fetchApiKey = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/api-key')
      if (response.ok) {
        const data = await response.json()
        setApiKeyData(data)
      } else if (response.status === 403) {
        setApiKeyData({
          message: t('messages.noSubscription'),
          apiKey: null,
        })
      } else {
        setApiKeyData({ message: t('messages.noKey'), apiKey: null })
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
      setApiKeyData({ message: t('messages.fetchError'), apiKey: null })
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleCopyApiKey = async () => {
    if (apiKeyData?.apiKey) {
      try {
        await navigator.clipboard.writeText(apiKeyData.apiKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy API key:', error)
      }
    }
  }

  const formatApiKey = (apiKey: string) => {
    // Format as: lama_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const prefix = apiKey.substring(0, 5) // "lama_"
    const rest = apiKey.substring(5)
    const chunks = rest.match(/.{1,8}/g) || []
    return `${prefix}${chunks.join('-')}`
  }

  useEffect(() => {
    if (user && isLoaded) {
      fetchApiKey()
    }
  }, [user, isLoaded, fetchApiKey])

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

      {loading ? (
        <Skeleton variant='rectangular' height={60} />
      ) : apiKeyData?.apiKey ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              letterSpacing: '0.5px',
              color: '#333',
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-all',
            }}
          >
            {formatApiKey(apiKeyData.apiKey)}
          </Paper>
          <IconButton
            onClick={handleCopyApiKey}
            sx={{
              backgroundColor: copied ? 'success.main' : 'primary.main',
              '&:hover': {
                backgroundColor: copied ? 'success.main' : 'primary.main',
                filter: 'drop-shadow(0 0 1px white)',
                transition:
                  'text-shadow 0.25s ease-in-out, color 0.25s ease-in-out',
              },
              '&:not(:hover)': {
                transition:
                  'text-shadow 0.5s ease-in-out, color 0.5s ease-in-out',
              },
            }}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </IconButton>
        </Box>
      ) : (
        <Alert
          severity='info'
          color='primary'
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {apiKeyData?.message || t('messages.subscribeToGetKey')}
        </Alert>
      )}
    </Box>
  )
}

export default ApiKeySection

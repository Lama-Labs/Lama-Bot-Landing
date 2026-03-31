'use client'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Globe, Info, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  type CrawlStatusResponse,
  deleteCrawlFileAction,
  getWebsiteKnowledgeStatusAction,
  triggerCrawlAction,
} from '@/app/actions/website-knowledge'

const POLL_INTERVAL_MS = 5000

const WebsiteKnowledge = () => {
  const [status, setStatus] = useState<CrawlStatusResponse | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useTranslations('dashboard')
  const locale = useLocale()

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getWebsiteKnowledgeStatusAction()
      setStatus(data)
      if (data.url) setUrl(data.url)
      return data
    } catch (err) {
      console.error('Error fetching website knowledge status:', err)
      setError(t('websiteKnowledge.messages.fetchError'))
      return null
    }
  }, [t])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      const data = await fetchStatus()
      if (data && data.status !== 'pending') {
        stopPolling()
        setCrawling(false)
      }
    }, POLL_INTERVAL_MS)
  }, [fetchStatus, stopPolling])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const data = await fetchStatus()
      if (data?.status === 'pending') {
        setCrawling(true)
        startPolling()
      }
      setLoading(false)
    }
    init()
    return () => stopPolling()
  }, [fetchStatus, startPolling, stopPolling])

  const handleCrawl = async () => {
    if (!url.trim()) {
      setError(t('websiteKnowledge.messages.urlRequired'))
      return
    }

    setError(null)
    setCrawling(true)

    const result = await triggerCrawlAction(url.trim())
    if (!result.success) {
      setError(result.error ?? t('websiteKnowledge.messages.crawlError'))
      setCrawling(false)
      return
    }

    const data = await fetchStatus()
    if (data?.status === 'pending') {
      startPolling()
    } else {
      setCrawling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const result = await deleteCrawlFileAction()
    if (!result.success) {
      setError(result.error ?? t('websiteKnowledge.messages.deleteError'))
    } else {
      await fetchStatus()
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <Box>
        <Typography variant='h6' sx={{ mb: 1 }}>
          {t('websiteKnowledge.title')}
        </Typography>
        <Skeleton variant='rectangular' height={60} />
      </Box>
    )
  }

  if (!status?.crawlEnabled) return null

  const cooldownDate = status?.cooldownEndsAt
    ? new Date(status.cooldownEndsAt).toLocaleDateString()
    : null

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant='h6'>
          {t('websiteKnowledge.title')}
        </Typography>
        <Tooltip
          title={t('websiteKnowledge.tooltip')}
          placement='right'
          arrow
        >
          <IconButton size='small' sx={{ color: 'primary.main' }}>
            <Info size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* URL Input + Crawl Button */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            size='small'
            fullWidth
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            placeholder={t('websiteKnowledge.urlPlaceholder')}
            disabled={crawling}
            slotProps={{
              input: {
                startAdornment: (
                  <Globe size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                ),
              },
            }}
          />
          <Tooltip
            title={
              !status?.canCrawl && cooldownDate
                ? t('websiteKnowledge.cooldownMessage', { date: cooldownDate })
                : ''
            }
            disableHoverListener={status?.canCrawl}
            disableFocusListener={status?.canCrawl}
            disableTouchListener={status?.canCrawl}
            arrow
          >
            <span>
              <Button
                variant='contained'
                onClick={handleCrawl}
                disabled={crawling || !status?.canCrawl}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {crawling ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} color='inherit' />
                    {t('websiteKnowledge.crawling')}
                  </Box>
                ) : (
                  t('websiteKnowledge.crawlButton')
                )}
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Error display */}
        {(error || status?.status === 'failed') && (
          <Alert
            severity='error'
            onClose={() => setError(null)}
          >
            {error || status?.errorMessage || t('websiteKnowledge.messages.crawlError')}
          </Alert>
        )}

        {/* Crawl file info row */}
        {status?.status === 'completed' && status.crawlFileId && (
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Globe size={20} style={{ flexShrink: 0, opacity: 0.6 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='body2' color='text.primary' noWrap>
                {status.url}
              </Typography>
              {status.lastCrawledAt && (
                <Typography variant='caption' color='text.secondary'>
                  {t('websiteKnowledge.lastCrawled', {
                    date: new Date(status.lastCrawledAt).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }),
                  })}
                </Typography>
              )}
            </Box>
            <Button
              variant='outlined'
              color='error'
              size='small'
              startIcon={<Trash2 size={16} />}
              loading={deleting}
              onClick={handleDelete}
            >
              {t('websiteKnowledge.deleteButton')}
            </Button>
          </Paper>
        )}

        {/* Status info when no crawl file exists */}
        {status?.lastCrawledAt && !(status?.status === 'completed' && status.crawlFileId) && (
          <Typography variant='caption' color='text.secondary'>
            {t('websiteKnowledge.lastCrawled', {
              date: new Date(status.lastCrawledAt).toLocaleString(),
            })}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default WebsiteKnowledge

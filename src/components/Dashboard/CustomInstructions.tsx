'use client'

import { useAuth } from '@clerk/nextjs'
import type { UserResource } from '@clerk/types'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import {
  getCustomInstructionsAction,
  saveCustomInstructionsAction,
} from '@/app/actions/custom-instructions'
import { hasAnyPlan } from '@/utils/clerk/subscription'

interface CustomInstructionsProps {
  user: UserResource | null | undefined
  isLoaded: boolean
}

const MAX_CHARACTERS = 5000

const CustomInstructions = ({ user, isLoaded }: CustomInstructionsProps) => {
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { has } = useAuth()
  const t = useTranslations('dashboard')

  // Check if user has active subscription
  const hasActiveSubscription = hasAnyPlan(has, 'basic', user?.publicMetadata)

  const fetchInstructions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCustomInstructionsAction()
      setInstructions(data)
    } catch (error) {
      console.error('Error fetching custom instructions:', error)
      setError(t('customInstructions.messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await saveCustomInstructionsAction(instructions)
    } catch (error) {
      console.error('Error saving custom instructions:', error)
      setError(
        error instanceof Error
          ? error.message
          : t('customInstructions.messages.error')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    // Only update if within character limit
    if (newValue.length <= MAX_CHARACTERS) {
      setInstructions(newValue)
      setError(null) // Clear any previous error when user starts typing
    }
  }

  useEffect(() => {
    if (user && isLoaded) {
      fetchInstructions()
    }
  }, [user, isLoaded, fetchInstructions])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant='h6'>{t('customInstructions.title')}</Typography>
        <Tooltip
          title={t('customInstructions.tooltip')}
          placement='right'
          arrow
        >
          <IconButton size='small' sx={{ color: 'primary.main' }}>
            <Info size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Skeleton variant='rectangular' height={250} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={instructions}
            onChange={handleChange}
            placeholder={t('customInstructions.placeholder')}
            variant='outlined'
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'inherit',
              },
            }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
            }}
          >
            <Typography
              variant='caption'
              color={
                instructions.length >= MAX_CHARACTERS
                  ? 'error'
                  : 'text.secondary'
              }
            >
              {t('customInstructions.characterCount', {
                count: instructions.length,
                max: MAX_CHARACTERS,
              })}
            </Typography>

            <Tooltip
              title={
                !hasActiveSubscription
                  ? t('files.tooltips.subscriptionRequired')
                  : ''
              }
              disableHoverListener={hasActiveSubscription}
              disableFocusListener={hasActiveSubscription}
              disableTouchListener={hasActiveSubscription}
              arrow
            >
              <span>
                <Button
                  variant='contained'
                  onClick={handleSave}
                  loading={saving}
                  disabled={
                    saving ||
                    instructions.length > MAX_CHARACTERS ||
                    !hasActiveSubscription
                  }
                >
                  {t('customInstructions.saveButton')}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {error && (
            <Alert
              severity='error'
              sx={{ mt: 1 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  )
}

export default CustomInstructions

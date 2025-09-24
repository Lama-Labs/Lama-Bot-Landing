'use client'

import { Alert, Snackbar } from '@mui/material'
import type { AlertColor } from '@mui/material/Alert/Alert'
import type { SnackbarCloseReason } from '@mui/material/Snackbar/Snackbar'
import { useTranslations } from 'next-intl'
import { forwardRef, useImperativeHandle, useState } from 'react'

export interface SnackbarHandle {
  snackbarOpenError: () => void
  snackbarOpenSuccess: () => void
}

const SnackbarComponent = forwardRef<SnackbarHandle>((props, ref) => {
  const t = useTranslations('snackbar')

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<AlertColor>('success')
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')

  const handleSnackbarClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return
    }

    setSnackbarOpen(false)
    setSnackbarMessage('')
  }

  const snackbarOpenError = () => {
    setSnackbarOpen(true)
    setSnackbarSeverity('error')
    setSnackbarMessage(t('error'))
  }

  const snackbarOpenSuccess = () => {
    setSnackbarOpen(true)
    setSnackbarSeverity('success')
    setSnackbarMessage(t('success'))
  }

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    snackbarOpenError,
    snackbarOpenSuccess,
  }))

  return (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={handleSnackbarClose}
    >
      <Alert
        onClose={handleSnackbarClose}
        severity={snackbarSeverity}
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>
  )
})

SnackbarComponent.displayName = 'SnackbarComponent'
export default SnackbarComponent

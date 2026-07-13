export const CHAT_ERROR_CODE = {
  TOKEN_QUOTA_EXCEEDED: 'TOKEN_QUOTA_EXCEEDED',
  SUBSCRIPTION_INVALID: 'SUBSCRIPTION_INVALID',
  NO_ACTIVE_TOKEN_WINDOW: 'NO_ACTIVE_TOKEN_WINDOW',
} as const

const CHAT_ERROR_BY_STATUS: Record<number, string> = {
  401: CHAT_ERROR_CODE.SUBSCRIPTION_INVALID,
  429: CHAT_ERROR_CODE.TOKEN_QUOTA_EXCEEDED,
}

const CHAT_ERROR_TRANSLATION_KEY: Record<string, string> = {
  [CHAT_ERROR_CODE.NO_ACTIVE_TOKEN_WINDOW]: 'subscriptionInvalidMessage',
  [CHAT_ERROR_CODE.SUBSCRIPTION_INVALID]: 'subscriptionInvalidMessage',
  [CHAT_ERROR_CODE.TOKEN_QUOTA_EXCEEDED]: 'tokenQuotaExceededMessage',
  DEFAULT: 'errorMessage',
}

export function getChatErrorCodeByStatus(status: number): string | null {
  return CHAT_ERROR_BY_STATUS[status] ?? null
}

export function getChatErrorTranslationKey(error: unknown): string {
  if (error instanceof Error) {
    return CHAT_ERROR_TRANSLATION_KEY[error.message] ?? CHAT_ERROR_TRANSLATION_KEY.DEFAULT
  }

  if (typeof error === 'string') {
    return CHAT_ERROR_TRANSLATION_KEY[error] ?? CHAT_ERROR_TRANSLATION_KEY.DEFAULT
  }

  return CHAT_ERROR_TRANSLATION_KEY.DEFAULT
}

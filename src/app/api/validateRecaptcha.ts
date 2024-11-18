'use server'

/**
 * Validates a reCAPTCHA token with the Google reCAPTCHA API.
 *
 * @param {string} recaptchaToken - The reCAPTCHA token to validate.
 *
 * @returns {boolean} - `true` if the token is valid; `false` if the token is not valid or if an error occurs during validation.
 */
export async function validateRecaptchaToken(recaptchaToken: string) {
  const googleRecaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify'
  const requestBody = {
    secret: process.env.RECAPTCHA_SECRET_KEY || 'aaa',
    response: recaptchaToken,
  }

  try {
    const response = await fetch(googleRecaptchaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody).toString(),
    })

    const responseData = await response.json()

    return !!responseData.success
  } catch (error) {
    // Handle any errors (e.g., network issues)
    console.error('reCAPTCHA validation error:', error)
    return false
  }
}

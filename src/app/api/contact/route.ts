import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, website, recaptchaToken } = await request.json()

    // Bot honeypot check - if website field is filled, it's likely a bot
    if (website && website.trim() !== '') {
      console.log('Bot detected - website field filled:', website)
      return NextResponse.json(
        { success: true, message: 'Success' },
        { status: 200 }
      )
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    const webhookResponse = await fetch(
      process.env.NEXT_PUBLIC_CONTACT_WEBHOOK_URL || '',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          website,
          recaptchaToken,
        }),
      }
    )

    if (!webhookResponse.ok) {
      throw new Error(`Webhook request failed: ${webhookResponse.status}`)
    }

    return NextResponse.json(
      { success: true, message: 'Email subscription successful' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing contact submission:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

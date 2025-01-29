import { readFile } from 'fs/promises'
import { join } from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { sendToPushBullet } from '@/app/api/PushBulletSend'

export async function GET(req: NextRequest) {
  const filePath = join(process.cwd(), 'assets/email_gif.gif')

  try {
    const ip = req.headers.get('x-forwarded-for') || 'Unknown IP'
    console.log(`Request received from IP: ${ip}`)

    const fileBuffer = await readFile(filePath)
    console.log(`Serving image: ${filePath}`)
    await sendToPushBullet(
      'Email Image Request',
      `Someone requested the email image from IP: ${ip}`
    )

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    )
  }
}

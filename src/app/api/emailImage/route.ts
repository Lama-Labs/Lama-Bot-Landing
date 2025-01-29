import { NextRequest, NextResponse } from 'next/server';

import { sendToPushBullet } from '@/app/api/PushBulletSend'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const emailId = searchParams.get('email_id') || 'unknown';

  // Get the real IP address if available
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent');

  console.log(`Email opened by ID: ${emailId}, IP: ${ip}, User-Agent: ${userAgent}`);

  // Return a 1x1 transparent GIF
  const transparentPixel = Buffer.from(
    'R0lGODlhAQABAIAAAP///////yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  await sendToPushBullet(
    'Email Image Request',
    `Opened: ${emailId}, IP: ${ip}, UA: ${userAgent}\n`
  )

  return new NextResponse(transparentPixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Expires': '0',
      'Pragma': 'no-cache',
    },
  });
}

export const revalidate = 60; // Cache for 60 seconds (1 minute)



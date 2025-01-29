import { NextRequest } from 'next/server'

export function handleImageRequests(req: NextRequest): void {
  const { pathname } = req.nextUrl
  const targetFileName = '/email/email_gif.gif'
  console.log(`Requested file: ${pathname}`)
  if (pathname === targetFileName) {
    console.log(`Exact file requested: ${pathname}`)
    // Add custom logic for handling the image request here
  }
}

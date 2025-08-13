import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  /* config options here */
  // TODO: Remove this when chat window is migrated
  typescript: {
    // Temporarily ignore type errors during build to allow incomplete routes to exist
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during builds
    ignoreDuringBuilds: true,
  },
  // TODO: remove up to here
}

export default withNextIntl(nextConfig)

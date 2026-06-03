import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
    ],
  },
  // Tipos serão gerados via `supabase gen types typescript` após conectar ao projeto
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig

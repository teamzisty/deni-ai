import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deni AI',
    description: 'A free, unlimited, and open-source AI chatbot.',
    start_url: '',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/assets/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
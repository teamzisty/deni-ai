'use client'

import React, { useState } from 'react'
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type AppRouter } from '@/trpc/routers/_app'
import { makeQueryClient } from '@/trpc/query-client'

/**
 * Client-Side (SPA) tRPC client.
 */
export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>()

// tRPC client singleton
let clientQueryClientSingleton: QueryClient | undefined = undefined
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient())
}

/**
 * TRPC Provider (wrapper component) for layout.tsx.
 */
function useTRPCClient() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    }),
  )
  return trpcClient
}

/**
 * TRPC Provider (wrapper component) for layout.tsx.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const trpcClient = useTRPCClient()

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

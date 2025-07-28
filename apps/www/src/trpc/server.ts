import 'server-only' // <-- ensure this file cannot be imported from the client

import { createHydrationHelpers } from '@trpc/react-query/rsc'
import { cache } from 'react'
import { createCallerFactory, createTRPCContext } from '@/trpc/init'
import { makeQueryClient } from './query-client'
import { AppRouter, appRouter } from '@/trpc/routers/_app'

export const getQueryClient = cache(makeQueryClient)
export const caller = createCallerFactory(appRouter)(createTRPCContext)

/**
 * TRPC Server-Side Client
 */
export const { 
  trpc, 
  HydrateClient 
} = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
)

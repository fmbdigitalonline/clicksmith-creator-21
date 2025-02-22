
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

const supabase = createClient(
  'https://xorlfvflpihtafugltni.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcmxmdmZscGlodGFmdWdsdG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzA3NDksImV4cCI6MjA0ODgwNjc0OX0.tuvMctblG6Oo6u9C41sBTaqCTbuKAdGLC4C5ZsLCc60'
)

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data cached for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus (disabled to prevent unwanted refetches)
      refetchOnWindowFocus: false,
      // Important for wizard/form state persistence
      structuralSharing: false
    },
    mutations: {
      // Retry failed mutations 3 times
      retry: 3,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <SessionContextProvider supabaseClient={supabase}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </SessionContextProvider>
);

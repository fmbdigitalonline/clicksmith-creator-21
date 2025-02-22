import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

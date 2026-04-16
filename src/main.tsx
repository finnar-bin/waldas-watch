import React from 'react'
import ReactDOM from 'react-dom/client'
import '@mantine/core/styles.css'
import './index.css'
import { MantineProvider } from '@mantine/core'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { theme } from './theme'
import { QueryProvider } from './providers/QueryProvider'
import { SessionProvider } from './providers/SessionProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <QueryProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </QueryProvider>
    </MantineProvider>
  </React.StrictMode>,
)

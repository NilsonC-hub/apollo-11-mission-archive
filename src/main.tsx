import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { RootLayout } from './app/RootLayout.tsx'
import './styles/global.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    hydrateFallbackElement: <div className="route-loading">OPENING MISSION RECORD</div>,
    children: [
      { index: true, element: <Navigate to="/archive" replace /> },
      { path: 'archive/*', lazy: () => import('./features/archive/ArchiveRoute.tsx') },
      { path: 'control/*', lazy: () => import('./features/control/ControlRoute.tsx') },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

import { useEffect, useLayoutEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { ensureControlHistoryEntryId } from './controlDeepLink.ts'
import {
  setActiveControlHistoryEntry,
  snapshotAndPauseActiveControlHistoryEntry,
} from './controlTraversal.ts'

export function RootLayout() {
  const location = useLocation()
  const control = location.pathname.startsWith('/control')
  const previousControl = useRef(control)

  useEffect(() => {
    document.documentElement.dataset.mode = control ? 'control' : 'archive'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', control ? '#070908' : '#e7e1d4')
  }, [control])

  useLayoutEffect(() => {
    if (previousControl.current && !control) snapshotAndPauseActiveControlHistoryEntry()
    setActiveControlHistoryEntry(control ? ensureControlHistoryEntryId(location.key) : null)
    previousControl.current = control
  }, [control, location.key])

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="global-header">
        <NavLink className="wordmark" to="/archive">
          <span className="wordmark-mark" aria-hidden="true">
            A11
          </span>
          <span>
            <b>APOLLO 11</b>
            <small>MISSION ARCHIVE</small>
          </span>
        </NavLink>
        <nav className="mode-nav" aria-label="Primary modes">
          <NavLink to="/archive">
            <span>01</span> ARCHIVE
          </NavLink>
          <NavLink to="/control">
            <span>02</span> MISSION CONTROL
          </NavLink>
        </nav>
        <NavLink className="source-link" to="/archive/sources">
          SOURCES / METHOD
        </NavLink>
      </header>
      <Outlet />
    </>
  )
}

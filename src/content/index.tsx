import React from 'react'
import { createRoot } from 'react-dom/client'
import Widget from '../components/Widget'
import styles from '../index.css?inline' // Import Tailwind styles as inline string

console.log('Content Script Loaded')

const CONTAINER_ID = 'global-focus-timer-root'

if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
  console.warn('HabitTrack content script skipped because the extension context is unavailable.')
} else {
  const existingContainer = document.getElementById(CONTAINER_ID)
  if (existingContainer) {
    existingContainer.remove()
  }

  // Create a container element
  const container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)

  // Create Shadow DOM
  const shadowRoot = container.attachShadow({ mode: 'open' })

  // Inject styles (This is simplified, for production we might need to fetch the CSS content)
  // For development with HMR, Vite injects styles into document.head.
  // We need to move/copy them into shadowRoot or use a style loader that supports Shadow DOM.
  // A simple trick for now is to find the style tags injected by Vite and clone them,
  // but that's complex.
  // Alternatively, we can use a library or just standard CSS modules.
  // Let's try to just render the App first.
  // Note: Tailwind might not work inside Shadow DOM without specific configuration.
  // For now, let's just render the component.

  const root = createRoot(shadowRoot)
  root.render(
    <React.StrictMode>
      <style>{styles}</style>
      <style>{`
        /* Reset for shadow DOM */
        :host {
          all: initial;
          z-index: 2147483647;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>
      <Widget />
    </React.StrictMode>
  )
}

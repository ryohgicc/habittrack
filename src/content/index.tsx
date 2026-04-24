import React from 'react'
import { createRoot } from 'react-dom/client'
import Widget from '../components/Widget'

const CONTAINER_ID = 'global-focus-timer-root'

function getMountTarget() {
  return document.body ?? document.documentElement
}

function attachContainer(container: HTMLElement) {
  const mountTarget = getMountTarget()

  if (container.parentElement !== mountTarget) {
    mountTarget.appendChild(container)
  }
}

if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
  console.warn('HabitTrack content script skipped because the extension context is unavailable.')
} else {
  const existingContainer = document.getElementById(CONTAINER_ID)
  if (existingContainer) {
    existingContainer.remove()
  }

  const container = document.createElement('div')
  container.id = CONTAINER_ID
  container.style.setProperty('all', 'initial')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.right = '0'
  container.style.bottom = '0'
  container.style.left = '0'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '2147483647'
  container.style.display = 'block'
  container.style.isolation = 'isolate'
  container.style.colorScheme = 'light dark'

  attachContainer(container)

  const shadowRoot = container.attachShadow({ mode: 'open' })
  const root = createRoot(shadowRoot)

  const reattachIfNeeded = () => {
    const mountTarget = getMountTarget()
    if (!mountTarget) {
      return
    }

    if (!container.isConnected || container.parentElement !== mountTarget) {
      attachContainer(container)
    }
  }

  const observer = new MutationObserver(() => {
    reattachIfNeeded()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })

  const triggerReattachSoon = () => {
    window.requestAnimationFrame(() => {
      reattachIfNeeded()
    })
  }

  const originalPushState = history.pushState.bind(history)
  history.pushState = (...args) => {
    const result = originalPushState(...args)
    triggerReattachSoon()
    return result
  }

  const originalReplaceState = history.replaceState.bind(history)
  history.replaceState = (...args) => {
    const result = originalReplaceState(...args)
    triggerReattachSoon()
    return result
  }

  window.addEventListener('popstate', triggerReattachSoon)
  window.addEventListener('hashchange', triggerReattachSoon)
  window.addEventListener('load', reattachIfNeeded)
  window.addEventListener('pageshow', reattachIfNeeded)
  document.addEventListener('readystatechange', reattachIfNeeded)
  document.addEventListener('visibilitychange', reattachIfNeeded)

  root.render(
    <React.StrictMode>
      <Widget />
    </React.StrictMode>
  )
}

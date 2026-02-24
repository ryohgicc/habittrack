import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: 'Global Four-Quadrant Focus Timer',
  description: 'A global Eisenhower Matrix focus timer injected into every webpage.',
  version: '1.0.0',
  manifest_version: 3,
  permissions: ['storage', 'tabs'], // 'activeTab' is not enough for global injection on load? 'tabs' might be needed or just host_permissions
  // Actually for content scripts on all URLs we need host_permissions
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.tsx'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.svg', '*.png', '*.jpg'],
      matches: ['<all_urls>'],
    },
  ],
})

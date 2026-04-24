import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: '四象限专注计时',
  description: '基于艾森豪威尔矩阵的全局网页专注计时器，随时随地管理你的时间。',
  version: '1.0.9',
  manifest_version: 3,
  action: {
    default_title: '四象限专注计时',
    default_popup: 'index.html',
  },
  permissions: ['storage', 'tabs', 'alarms'],
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

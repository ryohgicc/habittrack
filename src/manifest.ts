import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: '全局四象限专注计时 (HabitTrack)',
  description: '基于艾森豪威尔矩阵的全局网页专注计时器，随时随地管理你的时间。',
  version: '1.0.1',
  manifest_version: 3,
  action: {
    default_popup: 'index.html',
    default_title: '全局四象限专注计时',
  },
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

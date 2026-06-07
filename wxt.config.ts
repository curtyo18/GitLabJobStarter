import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  alias: { '@': 'src' },
  manifest: {
    name: 'GitLab Job Starter',
    description:
      'Automatically trigger matching manual CI jobs on GitLab pipeline pages using configurable name patterns.',
    permissions: ['storage'],
    host_permissions: ['*://*/*'],
    icons: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    action: {
      default_title: 'GitLab Job Starter',
      default_icon: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
  },
});

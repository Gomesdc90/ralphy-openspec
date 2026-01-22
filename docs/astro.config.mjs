import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ralphy-spec.org',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ko', 'ja'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true
    }
  }
});

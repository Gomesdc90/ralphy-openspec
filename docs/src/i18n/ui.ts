import en from './translations/en.json';
import zh from './translations/zh.json';
import ko from './translations/ko.json';
import ja from './translations/ja.json';

export const languages = {
  en: 'English',
  zh: '简体中文',
  ko: '한국어',
  ja: '日本語',
};

export const defaultLang = 'en';

export const ui = {
  en,
  zh,
  ko,
  ja,
} as const;

export type Lang = keyof typeof ui;
export type TranslationKey = keyof typeof en;

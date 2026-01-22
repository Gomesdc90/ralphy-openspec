import { ui, defaultLang, type Lang, type TranslationKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string {
    return ui[lang][key] || ui[defaultLang][key] || key;
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Check if path already has a language prefix
  const pathParts = cleanPath.split('/');
  if (pathParts[0] in ui) {
    pathParts[0] = lang;
    return '/' + pathParts.join('/');
  }
  
  return `/${lang}/${cleanPath}`;
}

export function getPathWithoutLang(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const pathParts = cleanPath.split('/');
  
  if (pathParts[0] in ui) {
    return '/' + pathParts.slice(1).join('/');
  }
  
  return '/' + cleanPath;
}

const LOCALE_STORAGE_KEY = 'endfieldaxis.ui.locale.v1';

export const supportedLngs = ['en', 'zh-CN'] as const;

export type SupportedLocale = (typeof supportedLngs)[number];

const isSupportedLocale = (value: string): value is SupportedLocale => {
  return supportedLngs.includes(value as SupportedLocale);
};

export const normalizeLocale = (value?: string | null): SupportedLocale => {
  if (!value) {
    return 'en';
  }

  if (value.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }

  if (value.toLowerCase().startsWith('en')) {
    return 'en';
  }

  return 'en';
};

export const getStoredLocale = (): SupportedLocale | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (!value) {
      return null;
    }

    if (isSupportedLocale(value)) {
      return value;
    }

    return normalizeLocale(value);
  } catch {
    return null;
  }
};

export const setStoredLocale = (lng: SupportedLocale): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  } catch {
    return;
  }
};

export const detectLocale = (): SupportedLocale => {
  const storedLocale = getStoredLocale();

  if (storedLocale) {
    return storedLocale;
  }

  if (typeof navigator === 'undefined') {
    return 'en';
  }

  return normalizeLocale(navigator.language);
};

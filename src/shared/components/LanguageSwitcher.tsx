import { useTranslation } from 'react-i18next';

import {
  setStoredLocale,
  type SupportedLocale,
} from '../../i18n/locale';

const buttonBaseClassName =
  'px-3 py-1 text-xs rounded border border-zinc-700 transition-colors';

const activeButtonClassName = 'bg-zinc-600 text-zinc-100';
const inactiveButtonClassName = 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  const handleLanguageChange = (language: SupportedLocale) => {
    void i18n.changeLanguage(language);
    setStoredLocale(language);
  };

  const getButtonClassName = (language: SupportedLocale) => {
    const stateClassName =
      activeLanguage === language ? activeButtonClassName : inactiveButtonClassName;

    return `${buttonBaseClassName} ${stateClassName}`;
  };

  return (
    <div data-testid="app-lang-switcher" className="flex items-center gap-2">
      <button
        type="button"
        data-testid="lang-en"
        className={getButtonClassName('en')}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        data-testid="lang-zh-CN"
        className={getButtonClassName('zh-CN')}
        onClick={() => handleLanguageChange('zh-CN')}
      >
        简体中文
      </button>
    </div>
  );
}

import { useTranslation } from "react-i18next";

import LanguageSwitcher from "./LanguageSwitcher";
import SolutionTabsArea from "../../features/solution/SolutionTabsArea";

export default function TopBar() {
  const { t } = useTranslation();

  return (
    <header
      data-testid="app-topbar"
      className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-2 backdrop-blur"
    >
      <div className="shrink-0">
        <h1 className="text-sm font-semibold text-zinc-300">
          {t("app.title")}
        </h1>
      </div>

      <div className="min-w-0 flex-1 overflow-y-visible">
        <SolutionTabsArea />
      </div>

      <div className="shrink-0">
        <LanguageSwitcher />
      </div>
    </header>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "fr";

const en: Record<string, string> = {
  "app.tagline": "Tech Training Platform",
  "common.logout": "Log out",
  "common.logoutShort": "Logout",
  "common.more": "More",
  "common.moreOptions": "More options",
  "common.language": "Language",
  "nav.home": "Home",
  "nav.dashboard": "Dashboard",
  "nav.courses": "Courses",
  "nav.learning-paths": "Learning Paths",
  "nav.labs": "Labs",
  "nav.master-classes": "Master Classes",
  "nav.training": "Training",
  "nav.leaderboard": "Leaderboard",
  "nav.ranks": "Ranks",
  "nav.notifications": "Notifications",
  "nav.certifications": "Certifications",
  "nav.certs": "Certs",
  "nav.referrals": "Referrals",
  "nav.registry": "Registry",
  "nav.enterprise": "Enterprise",
  "nav.admin": "Admin",
  "nav.admin-challenges": "Challenges",
  "nav.admin-badges": "Badges",
  "nav.admin-assessments": "Assessments",
  "nav.admin-learning-paths": "Learning Paths",
  "nav.analytics": "Analytics",
  "nav.audit": "Audit Logs",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.challenges": "Challenges",
  "nav.battle-pass": "Battle Pass",
  "nav.boss-missions": "Boss Missions",
  "nav.events": "Events",
  "nav.seasons": "Seasons",
  "nav.achievements": "Achievements",
  "nav.streak": "Streak",
  "nav.recommendations": "For You",
  "nav.badges": "Badges",
  "nav.assessments": "Assessments",
  "nav.my-analytics": "My Analytics",
  "nav.my-teams": "My Teams",
  "nav.admin-teams": "Teams",
  "nav.discussions": "Discussions",
  "nav.main": "Main navigation",
  "nav.mobile": "Mobile navigation",
};

const fr: Record<string, string> = {
  "app.tagline": "Plateforme de formation technique",
  "common.logout": "Se déconnecter",
  "common.logoutShort": "Déconnexion",
  "common.more": "Plus",
  "common.moreOptions": "Plus d'options",
  "common.language": "Langue",
  "nav.home": "Accueil",
  "nav.dashboard": "Tableau de bord",
  "nav.courses": "Cours",
  "nav.learning-paths": "Parcours",
  "nav.labs": "Laboratoires",
  "nav.master-classes": "Master Classes",
  "nav.training": "Formation",
  "nav.leaderboard": "Classement",
  "nav.ranks": "Rangs",
  "nav.notifications": "Notifications",
  "nav.certifications": "Certifications",
  "nav.certs": "Diplômes",
  "nav.referrals": "Parrainages",
  "nav.registry": "Registre",
  "nav.enterprise": "Entreprise",
  "nav.admin": "Admin",
  "nav.admin-challenges": "Defis",
  "nav.admin-badges": "Badges",
  "nav.admin-assessments": "Evaluations",
  "nav.admin-learning-paths": "Parcours",
  "nav.analytics": "Analyses",
  "nav.my-analytics": "Mes Analyses",
  "nav.audit": "Journaux d'audit",
  "nav.profile": "Profil",
  "nav.my-teams": "Mes Équipes",
  "nav.battle-pass": "Passe de Combat",
  "nav.boss-missions": "Missions Boss",
  "nav.events": "Événements",
  "nav.seasons": "Saisons",
  "nav.achievements": "Succès",
  "nav.streak": "Série",
  "nav.recommendations": "Pour Vous",
  "nav.admin-teams": "Équipes",
  "nav.discussions": "Discussions",
  "nav.main": "Navigation principale",
  "nav.mobile": "Navigation mobile",
};

const DICT: Record<Lang, Record<string, string>> = { en, fr };

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    return localStorage.getItem("lang") === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const t = useCallback(
    (key: string) => DICT[lang][key] ?? en[key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-lg bg-slate-100 w-fit ${className}`}
      role="group"
      aria-label="Language"
    >
      {(["en", "fr"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
            lang === l
              ? "bg-white text-[#0F203A] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

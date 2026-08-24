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
  "common.retry": "Retry",
  "common.error": "Something went wrong",
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
  "nav.domain-ranking": "Domain Ranking",
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
  "streak.title": "Streak",
  "streak.subtitle": "Keep your momentum going",
  "streak.current": "Current Streak",
  "streak.best": "Best Streak",
  "streak.combo": "Daily Combo",
  "streak.freezes": "Streak Freezes",
  "streak.freezesDesc": "Protect your streak when life happens",
  "streak.available": "Available freezes",
  "streak.nextFreeze": "Next freeze earned at {n}-day streak",
  "streak.moreDays": "{n} more days to earn a freeze",
  "streak.howItWorks": "How it works:",
  "streak.rule1": "Earn 1 freeze for every 7-day streak",
  "streak.rule2": "Freeze auto-activates if you miss 1 day",
  "streak.rule3": "Max 3 freezes stored at a time",
  "streak.milestones": "Streak Milestones",
  "streak.milestonesDesc": "XP bonuses at every 7-day mark",
  "streak.reached": "Reached",
  "streak.xpBonus": "+500 XP bonus",
  "achievements.title": "Achievements",
  "achievements.progress": "{unlocked} of {total} unlocked",
  "achievements.unlocked": "Unlocked",
  "achievements.xpEarned": "XP Earned",
  "achievements.complete": "Complete",
  "achievements.allTypes": "All Types",
  "seasons.title": "Seasons",
  "seasons.desc": "Track current season progress and competition",
  "seasons.history": "Season History",
  "seasons.noActive": "No Active Season",
  "seasons.noActiveDesc": "There is no season currently running. Check back soon for the next season.",
  "seasons.leaderboard": "Season Leaderboard",
  "seasons.noLeaderboard": "No leaderboard data yet",
  "events.title": "Global Events",
  "events.desc": "Join community events and compete for rewards",
  "events.active": "Active Events",
  "events.my": "My Events",
  "events.joined": "{n} joined",
  "events.communityProgress": "Community Progress",
  "events.claimReward": "Claim Reward",
  "events.inProgress": "In Progress",
  "events.joinEvent": "Join Event",
  "events.about": "About this event",
  "events.yourProgress": "Your Progress",
  "events.participants": "Participants",
  "events.totalXP": "Total XP",
  "events.completed": "Completed",
  "events.noActive": "No active events",
  "events.noJoined": "No events joined",
  "events.noActiveDesc": "Check back later for new community events",
  "events.noJoinedDesc": "Join an event to see it here",
  "boss.title": "Boss Missions",
  "boss.desc": "Challenge yourself against powerful boss labs",
  "boss.noActive": "No active boss missions",
  "boss.noActiveDesc": "Check back later for new boss challenges",
  "boss.viewMission": "View Mission",
  "boss.expired": "Expired",
  "boss.xpReward": "XP Reward",
  "boss.ratingReward": "Rating",
  "boss.attemptsLeft": "Attempts Left",
  "boss.domainReqs": "Domain Requirements",
  "boss.yourAttempts": "Your Attempts",
  "boss.leaderboard": "Leaderboard",
  "boss.noAttempts": "No attempts yet",
  "boss.noLeaderboard": "No leaderboard entries yet",
  "boss.completed": "Mission completed! Well done.",
  "boss.noAttemptsLeft": "No attempts remaining",
  "battlepass.tiers": "Tiers",
  "battlepass.leaderboard": "Leaderboard",
  "battlepass.noTiers": "No Tiers Available",
  "battlepass.noTiersDesc": "This battle pass has no tiers configured yet.",
  "battlepass.noLB": "No Leaderboard Data",
  "battlepass.noLBDesc": "No one has earned XP in this battle pass yet.",
};

const fr: Record<string, string> = {
  "app.tagline": "Plateforme de formation technique",
  "common.logout": "Se déconnecter",
  "common.logoutShort": "Déconnexion",
  "common.more": "Plus",
  "common.moreOptions": "Plus d'options",
  "common.language": "Langue",
  "common.retry": "Réessayer",
  "common.error": "Une erreur s'est produite",
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
  "nav.admin-challenges": "Défis",
  "nav.admin-badges": "Badges",
  "nav.admin-assessments": "Évaluations",
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
  "nav.domain-ranking": "Classement Domaine",
  "nav.achievements": "Succès",
  "nav.streak": "Série",
  "nav.recommendations": "Pour Vous",
  "nav.admin-teams": "Équipes",
  "nav.discussions": "Discussions",
  "nav.main": "Navigation principale",
  "nav.mobile": "Navigation mobile",
  "streak.title": "Série",
  "streak.subtitle": "Gardez votre élan",
  "streak.current": "Série actuelle",
  "streak.best": "Meilleure série",
  "streak.combo": "Combo quotidien",
  "streak.freezes": "Gels de série",
  "streak.freezesDesc": "Protégez votre série quand la vie arrive",
  "streak.available": "Gels disponibles",
  "streak.nextFreeze": "Prochain gel gagné à {n} jours",
  "streak.moreDays": "{n} jours de plus pour gagner un gel",
  "streak.howItWorks": "Comment ça marche :",
  "streak.rule1": "Gagnez 1 gel pour chaque série de 7 jours",
  "streak.rule2": "Le gel s'active automatiquement si vous manquez 1 jour",
  "streak.rule3": "Max 3 gels stockés à la fois",
  "streak.milestones": "Étapes de série",
  "streak.milestonesDesc": "Bonus XP à chaque marque de 7 jours",
  "streak.reached": "Atteint",
  "streak.xpBonus": "+500 XP bonus",
  "achievements.title": "Succès",
  "achievements.progress": "{unlocked} sur {total} débloqués",
  "achievements.unlocked": "Débloqués",
  "achievements.xpEarned": "XP gagnés",
  "achievements.complete": "Complet",
  "achievements.allTypes": "Tous les types",
  "seasons.title": "Saisons",
  "seasons.desc": "Suivez la progression de la saison actuelle",
  "seasons.history": "Historique des saisons",
  "seasons.noActive": "Aucune saison active",
  "seasons.noActiveDesc": "Aucune saison n'est en cours. Revenez bientôt pour la prochaine saison.",
  "seasons.leaderboard": "Classement de la saison",
  "seasons.noLeaderboard": "Pas encore de données de classement",
  "events.title": "Événements globaux",
  "events.desc": "Rejoignez les événements communautaires et compete pour des récompenses",
  "events.active": "Événements actifs",
  "events.my": "Mes événements",
  "events.joined": "{n} inscrits",
  "events.communityProgress": "Progrès communautaire",
  "events.claimReward": "Réclamer la récompense",
  "events.inProgress": "En cours",
  "events.joinEvent": "Rejoindre l'événement",
  "events.about": "À propos de cet événement",
  "events.yourProgress": "Votre progression",
  "events.participants": "Participants",
  "events.totalXP": "XP total",
  "events.completed": "Terminé",
  "events.noActive": "Aucun événement actif",
  "events.noJoined": "Aucun événement rejoint",
  "events.noActiveDesc": "Revenez plus tard pour de nouveaux événements",
  "events.noJoinedDesc": "Rejoignez un événement pour le voir ici",
  "boss.title": "Missions Boss",
  "boss.desc": "Défiez-vous contre des laboratoires boss puissants",
  "boss.noActive": "Aucune mission boss active",
  "boss.noActiveDesc": "Revenez plus tard pour de nouveaux défis boss",
  "boss.viewMission": "Voir la mission",
  "boss.expired": "Expiré",
  "boss.xpReward": "Récompense XP",
  "boss.ratingReward": "Classement",
  "boss.attemptsLeft": "Tentatives restantes",
  "boss.domainReqs": "Exigences de domaine",
  "boss.yourAttempts": "Vos tentatives",
  "boss.leaderboard": "Classement",
  "boss.noAttempts": "Pas encore de tentatives",
  "boss.noLeaderboard": "Pas encore d'entrées de classement",
  "boss.completed": "Mission terminée ! Bien joué.",
  "boss.noAttemptsLeft": "Plus de tentatives restantes",
  "battlepass.tiers": "Niveaux",
  "battlepass.leaderboard": "Classement",
  "battlepass.noTiers": "Aucun niveau disponible",
  "battlepass.noTiersDesc": "Ce passe de combat n'a pas de niveaux configurés.",
  "battlepass.noLB": "Aucune donnée de classement",
  "battlepass.noLBDesc": "Personne n'a encore gagné d'XP dans ce passe de combat.",
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

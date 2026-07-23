import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'nav.feed': 'Feed',
      'nav.map': 'Map',
      'nav.leaderboard': 'Top finders',
      'nav.marketplace': 'Marketplace',
      'nav.post': 'Post item',
      'nav.matches': 'Matches',
      'nav.chat': 'Chat',
      'nav.tags': 'QR tags',
      'nav.vault': 'Memory vault',
      'nav.courier': 'Courier',
      'nav.profile': 'Profile',
      'nav.settings': 'Settings',
      'nav.signin': 'Sign in',
      'nav.getstarted': 'Get started',
      'nav.signout': 'Sign out',
      'auth.welcomeBack': 'Welcome back',
      'auth.createAccount': 'Create your account',
    },
  },
  fr: {
    translation: {
      'nav.feed': 'Flux',
      'nav.map': 'Carte',
      'nav.leaderboard': 'Meilleurs trouveurs',
      'nav.marketplace': 'Marché',
      'nav.post': 'Publier',
      'nav.matches': 'Correspondances',
      'nav.chat': 'Chat',
      'nav.tags': 'QR tags',
      'nav.vault': 'Coffre',
      'nav.courier': 'Livraison',
      'nav.profile': 'Profil',
      'nav.settings': 'Paramètres',
      'nav.signin': 'Connexion',
      'nav.getstarted': 'Commencer',
      'nav.signout': 'Déconnexion',
      'auth.welcomeBack': 'Bon retour',
      'auth.createAccount': 'Créer un compte',
    },
  },
  tw: {
    translation: {
      'nav.feed': 'Mfomso',
      'nav.map': 'Asaase mfonini',
      'nav.leaderboard': 'Akantanfo',
      'nav.marketplace': 'Gua',
      'nav.post': 'To',
      'nav.matches': 'Ahyiae',
      'nav.chat': 'Nkitahodi',
      'nav.tags': 'QR tag',
      'nav.vault': 'Adekoradan',
      'nav.courier': 'Kɔde',
      'nav.profile': "Profil",
      'nav.settings': 'Nhyehyɛeɛ',
      'nav.signin': 'Bra mu',
      'nav.getstarted': 'Hyɛ aseɛ',
      'nav.signout': 'Pue',
      'auth.welcomeBack': 'Akwaaba bio',
      'auth.createAccount': 'Yɛ wo akawnt',
    },
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export { i18n };

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const resources = {
  en: {
    translation: {
      hero: {
        title: 'Reunite people with what they value.',
        subtitle:
          'Back2u is a smart lost & found ecosystem. Snap a photo, drop a pin, and our AI does the matching — across taxis, campuses, malls, and airports.',
      },
      cta: {
        postLost: 'Post a lost item',
        foundSomething: 'I found something',
      },
      nav: {
        browse: 'Browse',
        signIn: 'Sign in',
        openApp: 'Open app',
      },
    },
  },
  fr: {
    translation: {
      hero: {
        title: 'Rassemblez les gens avec ce qu\'ils chérissent.',
        subtitle:
          'Back2u est un écosystème intelligent d\'objets trouvés. Prenez une photo, géolocalisez, et notre IA fait le reste — taxis, campus, centres commerciaux et aéroports.',
      },
      cta: {
        postLost: 'Signaler un objet perdu',
        foundSomething: 'J\'ai trouvé quelque chose',
      },
      nav: {
        browse: 'Parcourir',
        signIn: 'Se connecter',
        openApp: 'Ouvrir l\'app',
      },
    },
  },
  tw: {
    translation: {
      hero: {
        title: 'Mmoa nnipa ma wɔne nneɛma a wɔpɛ bɛhyia.',
        subtitle:
          'Back2u yɛ nneɛma a wɔawɔ no hwehwɛbea a ɛwɔ nyansa. Fa foto, kyere bea, na yɛn AI bɛbɔ mmɔden — taxi, sukuu, mall ne airport so.',
      },
      cta: {
        postLost: 'Bɔ nneɛma a wɔawɔ no ho dawuru',
        foundSomething: 'Mihuu nneɛma bi',
      },
      nav: {
        browse: 'Hwehwɛ',
        signIn: 'Kɔ mu',
        openApp: 'Bue app no',
      },
    },
  },
  ga: {
    translation: {
      hero: {
        title: 'Tsɔɔ nii ni ehe fɛɛ eŋɔ.',
        subtitle:
          'Back2u yɛ nɔŋŋmɔ kɛ ji wolo yaa ŋmɔ. Gbe nitsumɔ, tsɔɔ kɛji, kɛ e-nyamma kɛha jɛmɔ — taxi, sukul, mall kɛ airport.',
      },
      cta: {
        postLost: 'Bɔ wolo nɔ ho dawuru',
        foundSomething: 'Mihuu nane',
      },
      nav: {
        browse: 'Kɛ ha',
        signIn: 'Shwie ŋmɔ',
        openApp: 'Wie app no',
      },
    },
  },
  ee: {
    translation: {
      hero: {
        title: 'Kpe ɖe amewo kple nusiwo wodi ho dzi.',
        subtitle:
          'Back2u nye nu dzɔdzɔe si le aɖaŋuɖo ŋuti. Ta alɔme, ɖo teƒe, eye míaƒe AI awɔ eŋu — taxi, suku, mall kple airport dzi.',
      },
      cta: {
        postLost: 'Bla aɖaŋuɖo ŋuti',
        foundSomething: 'Medi nu aɖe',
      },
      nav: {
        browse: 'Kpɔ nuwo',
        signIn: 'De eme',
        openApp: 'Dze app la me',
      },
    },
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

import type { Locale } from '@back2u/shared-types';
import { injectable } from 'inversify';

import type { II18nService } from '../../application/ports/services.js';

const DICT: Record<Locale, Record<string, string>> = {
  en: {
    'email.welcome.subject': 'Welcome to Back2u',
    'email.match.subject': 'Possible match for "{title}"',
    'email.chat.subject': 'New message on Back2u',
    'sms.otp.body': 'Your Back2u code is {code}.',
  },
  fr: {
    'email.welcome.subject': 'Bienvenue chez Back2u',
    'email.match.subject': 'Correspondance possible pour « {title} »',
    'email.chat.subject': 'Nouveau message sur Back2u',
    'sms.otp.body': 'Votre code Back2u est {code}.',
  },
  tw: {
    'email.welcome.subject': 'Akwaaba ba Back2u',
    'email.match.subject': 'Yɛahu biribi a ɛte sɛ "{title}"',
    'email.chat.subject': 'Nkrataa foforo wɔ Back2u so',
    'sms.otp.body': 'Wo Back2u koodu ne {code}.',
  },
  ga: {
    'email.welcome.subject': 'Ohenenyem ni Back2u',
    'email.match.subject': 'Wɔ mli ni "{title}"',
    'email.chat.subject': 'Awalo hee ke Back2u nɔ',
    'sms.otp.body': 'Bo Back2u koodi ji {code}.',
  },
  ee: {
    'email.welcome.subject': 'Woezɔ Back2u',
    'email.match.subject': 'Nu si sɔ kple "{title}"',
    'email.chat.subject': 'Gbedasi yeye le Back2u dzi',
    'sms.otp.body': 'Wò Back2u kɔdi nye {code}.',
  },
};

@injectable()
export class StaticI18nService implements II18nService {
  t(key: string, locale: Locale = 'en', vars: Record<string, string | number> = {}): string {
    const dict = DICT[locale] ?? DICT.en;
    const template = dict[key] ?? DICT.en[key] ?? key;
    if (!template) return key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
      template,
    );
  }
}

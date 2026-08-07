import type { Locale } from '@back2u/shared-types';
import { injectable } from 'inversify';

import type { II18nService } from '../../application/ports/services.js';

const DICT: Record<Locale, Record<string, string>> = {
  en: {
    'email.welcome.subject': 'Welcome to bak2me',
    'email.match.subject': 'Possible match for "{title}"',
    'email.chat.subject': 'New message on bak2me',
    'sms.otp.body': 'Your bak2me code is {code}.',
  },
  fr: {
    'email.welcome.subject': 'Bienvenue chez bak2me',
    'email.match.subject': 'Correspondance possible pour « {title} »',
    'email.chat.subject': 'Nouveau message sur bak2me',
    'sms.otp.body': 'Votre code bak2me est {code}.',
  },
  tw: {
    'email.welcome.subject': 'Akwaaba ba bak2me',
    'email.match.subject': 'Yɛahu biribi a ɛte sɛ "{title}"',
    'email.chat.subject': 'Nkrataa foforo wɔ bak2me so',
    'sms.otp.body': 'Wo bak2me koodu ne {code}.',
  },
  ga: {
    'email.welcome.subject': 'Ohenenyem ni bak2me',
    'email.match.subject': 'Wɔ mli ni "{title}"',
    'email.chat.subject': 'Awalo hee ke bak2me nɔ',
    'sms.otp.body': 'Bo bak2me koodi ji {code}.',
  },
  ee: {
    'email.welcome.subject': 'Woezɔ bak2me',
    'email.match.subject': 'Nu si sɔ kple "{title}"',
    'email.chat.subject': 'Gbedasi yeye le bak2me dzi',
    'sms.otp.body': 'Wò bak2me kɔdi nye {code}.',
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

import { LegalProse, PageShell } from '../components/PageShell';

export function Privacy() {
  return (
    <PageShell>
      <LegalProse
        title="Privacy Policy"
        updated="30 May 2026"
        intro="Back2u helps reunite people with what they value. Handling lost belongings means handling personal data with care. This policy explains what we collect, why, and the choices you have."
        sections={[
          {
            heading: 'What we collect',
            body: 'Account details you provide (name, email, optional phone and avatar), the items you post (photos, descriptions, categories), and the approximate locations and times you attach to them. We also collect device and usage data needed to run the service, such as push-notification subscriptions and basic analytics.',
          },
          {
            heading: 'How we use it',
            body: 'To match lost and found items using visual, textual, geospatial, and temporal signals; to notify you of likely matches and messages; to verify ownership before a hand-off; and to keep the platform safe from fraud and abuse. We never sell your personal data.',
          },
          {
            heading: 'Anonymous by default',
            body: 'In-app chat is anonymous — your phone number and email are never shown to other users. When someone scans a QR tag, they see only a contact form, not your identity. You decide what to reveal and when.',
          },
          {
            heading: 'Location data',
            body: 'Item pins and zone alerts use coordinates you choose to share. You can post without precise location, and you can delete an item (and its location) at any time.',
          },
          {
            heading: 'Data sharing',
            body: 'We share data only with service providers who help us operate (for example image hosting, email, SMS, and payment partners), with partner institutions for items handed to their lost-and-found desks, and with authorities where legally required (for example a verified police report on a stolen item).',
          },
          {
            heading: 'Your rights',
            body: 'You can view, export, and delete your data from Settings at any time. Deleting your account permanently anonymises your records. For questions or requests, contact our team using the address in the footer.',
          },
          {
            heading: 'Retention',
            body: 'We keep posts and messages while they are useful for reunions and for a reasonable period afterwards for safety and dispute resolution, then anonymise or remove them.',
          },
        ]}
      />
    </PageShell>
  );
}

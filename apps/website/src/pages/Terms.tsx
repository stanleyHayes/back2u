import { LegalProse, PageShell } from '../components/PageShell';

export function Terms() {
  return (
    <PageShell>
      <LegalProse
        title="Terms of Service"
        updated="30 May 2026"
        intro="These terms govern your use of Back2u. By creating an account or using the service, you agree to them. Please read them — they keep the community safe and fair."
        sections={[
          {
            heading: 'Using Back2u',
            body: 'You must be old enough to form a binding contract in your country to use Back2u. You are responsible for the accuracy of what you post and for keeping your account secure. Do not impersonate others or post on behalf of someone without permission.',
          },
          {
            heading: 'Posting items',
            body: 'Only post items you genuinely lost or found. Found items should be reported honestly; claiming an item you did not find, or refusing to return an item to its rightful owner, is prohibited and may be unlawful.',
          },
          {
            heading: 'Rewards, courier, and fees',
            body: 'Owners may offer optional rewards and request courier delivery. Where money changes hands, fees and payouts are handled through our payment partners. Rewards are released only after ownership is verified. You are responsible for any taxes that apply to amounts you receive.',
          },
          {
            heading: 'Acceptable use',
            body: 'No fraud, harassment, spam, hate speech, or illegal activity. Chat is auto-moderated; abusive behaviour can lead to suspension. Do not attempt to deanonymise other users or circumvent safety features.',
          },
          {
            heading: 'Verification & disputes',
            body: 'For valuable items we use a verification flow (receipts, serial numbers, item-specific questions). We may pause a hand-off or reward release while a dispute is reviewed. Our decisions aim to protect rightful owners and honest finders.',
          },
          {
            heading: 'Liability',
            body: 'Back2u is a platform that connects people; we do not take custody of items and cannot guarantee a reunion. To the extent permitted by law, we are not liable for loss, damage, or disputes arising between users. Always meet safely and use the in-app tools.',
          },
          {
            heading: 'Changes',
            body: 'We may update these terms as the service evolves. If we make material changes we will notify you. Continued use after an update means you accept the revised terms.',
          },
        ]}
      />
    </PageShell>
  );
}

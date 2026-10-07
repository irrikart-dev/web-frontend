import { LEGAL } from '../../lib/legal';
import { H2, LegalLayout, List } from './LegalLayout';

/** The page Google Play's "account deletion URL" points to. */
export function DeleteAccountPage() {
  const mail = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(
    'Delete my IrriKart account',
  )}&body=${encodeURIComponent(
    'Please delete my IrriKart account. The Google email I sign in with is: ',
  )}`;

  return (
    <LegalLayout title="Delete your IrriKart account">
      <H2>Delete in the app (instant)</H2>
      <List
        items={[
          'Open the IrriKart app and sign in.',
          'Go to Account.',
          'Tap “Delete account” and confirm.',
        ]}
      />
      <p>Your account is deleted immediately and you are signed out.</p>

      <H2>Can’t access the app?</H2>
      <p>
        Send a deletion request from the email address of the Google account you sign in with —{' '}
        <a href={mail}>{LEGAL.supportEmail}</a> — or message us on WhatsApp at{' '}
        <a href={LEGAL.whatsAppLink}>{LEGAL.whatsApp}</a>. We verify the request and delete the
        account within 7 days.
      </p>

      <H2>What is deleted</H2>
      <List
        items={[
          'Your sign-in account and profile (name, email, photo).',
          'Saved addresses and phone numbers.',
          'Your cart, reviews and bulk-quote requests.',
          'Notifications and device registrations.',
        ]}
      />

      <H2>What is kept, and for how long</H2>
      <p>
        Records of orders you placed — items, amounts, payment reference and the delivery address
        they shipped to — are retained without your account identity because Indian GST law
        requires invoice records to be kept (generally 8 years). They are then deleted.
      </p>
    </LegalLayout>
  );
}

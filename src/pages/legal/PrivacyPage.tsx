import { LEGAL } from '../../lib/legal';
import { H2, LegalLayout, List } from './LegalLayout';

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This policy explains how {LEGAL.entity} (“IrriKart”, “we”) collects, uses and protects
        personal data when you use the IrriKart mobile app and related services. We process
        personal data in line with the Digital Personal Data Protection Act, 2023 and the
        Information Technology Act, 2000.
      </p>

      <H2>1. Data we collect</H2>
      <List
        items={[
          <>
            <strong>Account data</strong> — your name, email address and profile photo from your
            Google account when you sign in with Google.
          </>,
          <>
            <strong>Delivery data</strong> — names, phone numbers and addresses you save for
            delivery.
          </>,
          <>
            <strong>Order data</strong> — items you buy, order amounts, order status and
            delivery tracking.
          </>,
          <>
            <strong>Payment data</strong> — payments are processed by Razorpay. We receive the
            payment status and a payment reference; we never see or store your card, UPI PIN or
            bank credentials.
          </>,
          <>
            <strong>Content you provide</strong> — product reviews and ratings, bulk-quote
            requests and messages you send to support.
          </>,
          <>
            <strong>On your device only</strong> — your wishlist, recent searches, recently
            viewed products and theme preference are stored on your phone and are not sent to
            us.
          </>,
        ]}
      />

      <H2>2. How we use it</H2>
      <List
        items={[
          'To create and secure your account and keep you signed in.',
          'To process orders and payments, deliver products and handle returns and refunds.',
          'To show order history, delivery updates and customer support.',
          'To publish reviews you choose to post (shown with your name).',
          'To meet legal, tax (GST) and accounting obligations and prevent fraud.',
        ]}
      />
      <p>We do not sell your personal data and we do not use it for third-party advertising.</p>

      <H2>3. Who we share it with</H2>
      <List
        items={[
          'Google Firebase — sign-in and authentication.',
          'Razorpay — payment processing.',
          'Our logistics partners (e.g. Shiprocket and its couriers) — name, phone and delivery address, only to deliver your order.',
          'Sellers on IrriKart — the order details needed to fulfil items they sell.',
          'Hosting and infrastructure providers that run our servers and database, under confidentiality obligations.',
          'Government authorities where required by law.',
        ]}
      />

      <H2>4. Security</H2>
      <p>
        Data is encrypted in transit (HTTPS). Access to personal data is restricted to people who
        need it to run the service. Sign-in sessions are managed by Google Firebase.
      </p>

      <H2>5. Retention</H2>
      <p>
        We keep account data while your account is active. If you delete your account we erase
        your profile, saved addresses, cart, reviews and requests. Invoices and order records —
        including the delivery address an order shipped to — are retained without your account
        identity for as long as Indian tax law requires (generally 8 years).
      </p>

      <H2>6. Your rights</H2>
      <p>
        You can access and correct your details in the app (Account → Your details, Saved
        addresses), and you can delete your account at any time from Account → Delete account,
        or as described on our <a href="/delete-account">account deletion page</a>. You may also
        withdraw consent, request information about how your data is processed, or nominate a
        person to exercise your rights, by contacting us below.
      </p>

      <H2>7. Children</H2>
      <p>IrriKart is not intended for anyone under 18, and we do not knowingly collect their data.</p>

      <H2>8. Contact and grievances</H2>
      <p>
        Grievance Officer: {LEGAL.grievanceOfficer}
        <br />
        Email: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
        <br />
        WhatsApp: <a href={LEGAL.whatsAppLink}>{LEGAL.whatsApp}</a>
        <br />
        Address: {LEGAL.address}
      </p>
      <p>We acknowledge grievances within 48 hours and resolve them within 30 days.</p>

      <H2>9. Changes</H2>
      <p>
        We may update this policy. Material changes will be announced in the app, and the
        effective date above will change.
      </p>
    </LegalLayout>
  );
}

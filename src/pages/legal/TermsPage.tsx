import { LEGAL } from '../../lib/legal';
import { H2, LegalLayout, List } from './LegalLayout';

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        These terms govern your use of the IrriKart app operated by {LEGAL.entity}. By creating
        an account or placing an order you agree to them.
      </p>

      <H2>1. Accounts</H2>
      <p>
        You must be 18 or older and sign in with a Google account you control. You are
        responsible for activity on your account. You can delete your account at any time from
        Account → Delete account.
      </p>

      <H2>2. Products and prices</H2>
      <List
        items={[
          'Products are sold by IrriKart and by sellers listed on IrriKart.',
          'Prices are in Indian Rupees and include applicable taxes unless stated otherwise.',
          'Price and stock are confirmed at checkout. We may cancel an order if an item becomes unavailable or was listed with a clear pricing error; any amount paid is refunded in full.',
        ]}
      />

      <H2>3. Orders and payment</H2>
      <p>
        All orders are prepaid through Razorpay (UPI, cards or netbanking). An order is
        confirmed once payment succeeds. Cash on delivery is not offered.
      </p>

      <H2>4. Delivery</H2>
      <p>
        We deliver across India through logistics partners. Dispatch and delivery times shown in
        the app are estimates. Please provide an accurate address and a reachable phone number.
      </p>

      <H2>5. Returns and refunds</H2>
      <p>
        Return eligibility and timelines are described in the app under Account → Returns &
        refunds. Approved refunds are issued to the original payment method.
      </p>

      <H2>6. Reviews</H2>
      <p>
        Reviews must be honest and relate to a product you bought. We may remove reviews that
        are abusive, misleading or unrelated.
      </p>

      <H2>7. Acceptable use</H2>
      <p>
        Do not misuse the app, attempt to access other users’ data, interfere with the service,
        or use it for unlawful purposes.
      </p>

      <H2>8. Liability</H2>
      <p>
        To the extent permitted by law, our liability for any order is limited to the amount you
        paid for it. Product warranties, where offered, are provided by the manufacturer.
      </p>

      <H2>9. Governing law</H2>
      <p>These terms are governed by the laws of India.</p>

      <H2>10. Contact</H2>
      <p>
        Email: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> · WhatsApp:{' '}
        <a href={LEGAL.whatsAppLink}>{LEGAL.whatsApp}</a>
      </p>
    </LegalLayout>
  );
}

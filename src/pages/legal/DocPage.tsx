import { LEGAL } from '../../lib/legal';
import { LegalLayout } from './LegalLayout';

/**
 * Renders a section of the client's T&C document verbatim. The HTML is our
 * own build-time content (converted from assets/docs/t&c.docx in the mobile
 * repo), never user input.
 */
export function DocPage({ title, html }: { title: string; html: string }) {
  return (
    <LegalLayout title={title}>
      <div className="legal-doc" dangerouslySetInnerHTML={{ __html: html }} />
      <section className="mt-10 border-t border-ink-100 pt-6 text-sm">
        <p className="font-semibold text-ink-900">{LEGAL.entity}</p>
        <p>{LEGAL.address}</p>
        <p>
          Email: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> · WhatsApp:{' '}
          <a href={LEGAL.whatsAppLink}>{LEGAL.whatsApp}</a>
        </p>
      </section>
    </LegalLayout>
  );
}

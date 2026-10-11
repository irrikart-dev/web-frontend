import html from './content/refund.html?raw';
import { DocPage } from './DocPage';

export function RefundPage() {
  return <DocPage title="Cancellation & Refund Policy" html={html} />;
}

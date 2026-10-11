import html from './content/terms.html?raw';
import { DocPage } from './DocPage';

export function TermsPage() {
  return <DocPage title="Terms and Conditions" html={html} />;
}

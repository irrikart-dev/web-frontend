import html from './content/privacy.html?raw';
import { DocPage } from './DocPage';

export function PrivacyPage() {
  return <DocPage title="Privacy Policy" html={html} />;
}

import html from './content/about.html?raw';
import { DocPage } from './DocPage';

export function AboutPage() {
  return <DocPage title="About Us" html={html} />;
}

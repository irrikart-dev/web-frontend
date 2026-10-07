import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { LEGAL } from '../../lib/legal';

/** Public, unauthenticated shell for the legal pages. */
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <img src="/irrikart_logo_mark.png" alt="" className="h-8 w-8" />
          <span className="text-lg font-bold">IrriKart</span>
          <nav className="ml-auto flex gap-4 text-sm text-ink-500">
            <Link to="/privacy" className="hover:text-ink-900">Privacy</Link>
            <Link to="/terms" className="hover:text-ink-900">Terms</Link>
            <Link to="/delete-account" className="hover:text-ink-900">Delete account</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">Effective {LEGAL.effectiveDate}</p>
        <div className="legal mt-8 space-y-6 leading-7 text-ink-700">{children}</div>
      </main>
      <footer className="border-t border-ink-100 py-6 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {LEGAL.entity}
      </footer>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 text-xl font-bold text-ink-900">{children}</h2>;
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-6">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

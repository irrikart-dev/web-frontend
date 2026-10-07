import { useState, type FormEvent } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';

import { IconEye, IconEyeOff } from '../components/icons';
import { useAuth } from '../lib/auth';
import { firebaseAuth } from '../lib/firebase';

export function LoginPage() {
  const { logIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Firebase emails the reset link; same message whether or not the account exists,
  // so the form can't be used to probe which emails are registered
  async function resetPassword() {
    setError(null);
    if (!email.trim()) {
      setError('Enter your email above first.');
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
    } catch {
      // swallowed on purpose — see above
    }
    setNotice(`If ${email.trim()} has an account, a reset link is on its way.`);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await logIn(email, password);
      // Routing is handled by <App>: `user` flipping to non-null swaps the tree.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on phones, where the form should own the fold. */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-water-500 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10" />
        <img
          src="/irrikart_logo_full.png"
          alt="IrriKart"
          className="relative h-14 w-auto object-contain brightness-0 invert"
        />
        <div className="relative text-white">
          <h2 className="text-4xl leading-tight font-extrabold">
            Run the whole
            <br />
            catalogue from here.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Add products, correct SKUs and change pricing — every edit reaches the
            IrriKart mobile app the next time it loads the catalogue.
          </p>
        </div>
        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} IrriKart · Admin console
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <img
            src="/irrikart_logo_full.png"
            alt="IrriKart"
            className="mb-8 h-11 w-auto object-contain lg:hidden"
          />
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Use your IrriKart administrator credentials.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="field"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="field pr-10"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-300 hover:text-ink-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <IconEyeOff width={18} height={18} />
                  ) : (
                    <IconEye width={18} height={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="-mt-2 text-right">
              <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={resetPassword}>
                Forgot password?
              </button>
            </div>

            {notice && (
              <p className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700">{notice}</p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button className="btn-primary w-full py-2.5" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

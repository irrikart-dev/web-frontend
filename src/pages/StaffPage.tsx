import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { ADMIN_PERMISSIONS, type AdminPermission, type StaffUser } from '../lib/types';

const AREA_LABEL: Record<AdminPermission, string> = {
  catalog: 'Catalogue (products, categories, brands)',
  inventory: 'Inventory',
  orders: 'Orders',
  payments: 'Payments',
  vendors: 'Vendors',
};

export function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState<AdminPermission[]>(['orders']);

  const load = useCallback(async () => {
    try {
      setStaff((await api<{ data: StaffUser[] }>('/admin/staff')).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function add(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      await api('/admin/staff', { method: 'POST', body: JSON.stringify({ email: email.trim(), permissions: perms }) });
      setEmail('');
    });
  }

  function savePermissions(user: StaffUser, permissions: AdminPermission[]) {
    if (permissions.length === 0) {
      setError('A sub-admin needs at least one area — remove them instead.');
      return;
    }
    void run(() => api(`/admin/staff/${user.id}`, { method: 'PATCH', body: JSON.stringify({ permissions }) }));
  }

  function remove(user: StaffUser) {
    if (!confirm(`Remove ${user.email ?? 'this user'} from staff? They keep their account but lose dashboard access.`)) return;
    void run(() => api(`/admin/staff/${user.id}`, { method: 'DELETE' }));
  }

  return (
    <div className="max-w-4xl space-y-5">
      <form onSubmit={add} className="card space-y-4 p-5">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Add a sub-admin</h3>
          <p className="text-xs text-ink-500">
            They must sign in to this dashboard once first (they'll be turned away, but their account gets created).
          </p>
        </div>
        <input
          className="field"
          type="email"
          placeholder="name@irrikart.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PermissionChecks value={perms} onChange={setPerms} />
        <div className="flex justify-end">
          <button className="btn-primary" disabled={!email.trim() || perms.length === 0}>
            Add sub-admin
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Since</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-500">
                    Loading staff...
                  </td>
                </tr>
              )}
              {staff.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{u.name ?? u.email}</p>
                    <p className="text-xs text-ink-300">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'ADMIN' ? (
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                        Full admin
                      </span>
                    ) : (
                      <PermissionChecks value={u.permissions} onChange={(next) => savePermissions(u, next)} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role === 'SUB_ADMIN' && (
                      <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => remove(u)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-ink-300">
        Full admins are managed with <code>npm run promote-admin</code> on the backend. Staff management itself is
        never delegated.
      </p>
    </div>
  );
}

function PermissionChecks({
  value,
  onChange,
}: {
  value: AdminPermission[];
  onChange: (v: AdminPermission[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {ADMIN_PERMISSIONS.map((p) => (
        <label key={p} className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={value.includes(p)}
            onChange={() => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p])}
          />
          {AREA_LABEL[p]}
        </label>
      ))}
    </div>
  );
}

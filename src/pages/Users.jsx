import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import CustomSelect from '../components/CustomSelect';

const StatusBadge = ({ u }) => {
  const status = u.is_banned ? 'banned' : u.is_suspended ? 'suspended' : 'active';
  const map = {
    banned:    'bg-rose-50 text-rose-600 border-rose-100',
    suspended: 'bg-amber-50 text-amber-600 border-amber-100',
    active:    'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status]}`}>
        {status}
      </span>
      {u.is_verified && (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-600 border-blue-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
          </svg>
          Verified
        </span>
      )}
    </div>
  );
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const limit = 20;

  // Single source of truth: status always comes from the URL
  const status = searchParams.get('status') || '';
  const setStatus = (val) => {
    setPage(1);
    setSearchParams(val ? { status: val } : {}, { replace: true });
  };

  const fetchUsers = async (overrides = {}) => {
    setLoading(true);
    try {
      const p  = overrides.page      ?? page;
      const st = overrides.status    ?? status;
      const ut = overrides.userType  ?? userType;
      const sr = overrides.search    ?? search;
      const params = new URLSearchParams({ page: p, limit });
      if (sr) params.set('search', sr);
      if (st) params.set('status', st);
      if (ut) params.set('user_type', ut);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Re-fetch whenever URL status, page, or userType changes
  useEffect(() => { fetchUsers(); }, [page, status, userType]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers({ page: 1 }); };
  const getUserStatus = (u) => u.is_banned ? 'banned' : u.is_suspended ? 'suspended' : 'active';

  const filterLabels = {
    active:         'Active users',
    banned:         'Banned users',
    suspended:      'Suspended users',
    verified:       'Verified users',
    active_today:   'Active today',
    new_this_week:  'New this week',
    monthly_active: 'Monthly active users',
    has_matches:    'Users with matches',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {total.toLocaleString()} {status ? filterLabels[status] ?? 'users' : 'total users'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <CustomSelect
            value={status}
            onChange={val => { setStatus(val); setPage(1); }}
            placeholder="All Status"
            className="w-full sm:w-44"
            options={[
              { value: '', label: 'All Users' },
              {
                group: 'Account Status',
                items: [
                  { value: 'active',    label: 'Active' },
                  { value: 'banned',    label: 'Banned' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'verified',  label: 'Verified' },
                ],
              },
              {
                group: 'Activity',
                items: [
                  { value: 'active_today',   label: 'Active Today' },
                  { value: 'new_this_week',  label: 'New This Week' },
                  { value: 'monthly_active', label: 'Monthly Active' },
                  { value: 'has_matches',    label: 'Has Matches' },
                ],
              },
            ]}
          />
          <CustomSelect
            value={userType}
            onChange={val => { setUserType(val); setPage(1); }}
            placeholder="All Types"
            className="w-full sm:w-36"
            options={[
              { value: '',             label: 'All Types' },
              { value: 'individual',   label: 'Individual' },
              { value: 'professional', label: 'Professional' },
            ]}
          />
          <button type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Streak</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3.5"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-200">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <p className="text-sm">No users found</p>
                    </div>
                  </td></tr>
                )}
                {users.map(u => {
                  const st = getUserStatus(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=e0e7ff&color=4338ca&size=80`}
                            alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-100"
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{u.name || 'No name'}</p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{u.id?.slice(0, 14)}…</p>
                          </div>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {u.email ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                              </svg>
                              <span className="truncate max-w-[160px]">{u.email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">No email</span>
                          )}
                          {u.phone ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              <span>{u.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 capitalize text-sm">{u.user_type?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-5 py-3.5"><StatusBadge u={u} /></td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-gray-600 text-sm">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-orange-400">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                          </svg>
                          {u.current_streak || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => navigate(`/users/${u.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
              <p className="text-xs text-gray-400">
                {total === 0 ? '0 results' : `${((page-1)*limit)+1}–${Math.min(page*limit, total)} of ${total}`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-500"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="px-3 py-1 text-xs text-gray-600 font-medium">Page {page}</span>
                <button onClick={() => setPage(p => p+1)} disabled={page * limit >= total}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-500"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">No users found</div>
            )}
            {users.map(u => {
              const st = getUserStatus(u);
              return (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=e0e7ff&color=4338ca`}
                      alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{u.name || 'No name'}</p>
                          {u.email && <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>}
                          {u.phone && <p className="text-xs text-gray-400 mt-0.5">{u.phone}</p>}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <StatusBadge u={u} />
                          </div>
                        </div>
                        <button onClick={() => navigate(`/users/${u.id}`)}
                          className="text-indigo-600 text-xs bg-indigo-50 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
                          View
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 capitalize">{u.user_type?.replace(/_/g, ' ') || '—'} · {u.current_streak || 0} day streak</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">{total} total</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 bg-white">Prev</button>
                <span className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg">{page}</span>
                <button onClick={() => setPage(p => p+1)} disabled={page * limit >= total}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 bg-white">Next</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

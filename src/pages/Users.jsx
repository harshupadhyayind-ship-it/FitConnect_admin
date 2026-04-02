import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const STATUS_BADGE = {
  banned:    'bg-red-100 text-red-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [userType, setUserType] = useState('');
  const navigate = useNavigate();
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (userType) params.set('user_type', userType);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, status, userType]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };
  const getUserStatus = (u) => u.is_banned ? 'banned' : u.is_suspended ? 'suspended' : 'active';

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 lg:p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 lg:gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={userType} onChange={e => { setUserType(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="professional">Professional</option>
          </select>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">User</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Streak</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Joined</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
                  )}
                  {users.map(u => {
                    const st = getUserStatus(u);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=6366f1&color=fff`} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900">{u.name || 'No name'}</p>
                              <p className="text-xs text-gray-400">{u.id?.slice(0, 14)}...</p>
                            </div>
                            {u.is_verified && <span className="text-blue-500 text-xs">✓</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 capitalize text-sm">{u.user_type?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[st]}`}>{st}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">🔥 {u.current_streak || 0}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => navigate(`/users/${u.id}`)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {total === 0 ? '0 results' : `${((page-1)*limit)+1}–${Math.min(page*limit, total)} of ${total}`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                <span className="px-3 py-1.5 text-sm text-gray-700">Page {page}</span>
                <button onClick={() => setPage(p => p+1)} disabled={page * limit >= total} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
              </div>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No users found</div>
            )}
            {users.map(u => {
              const st = getUserStatus(u);
              return (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=6366f1&color=fff`} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.name || 'No name'}</p>
                        {u.is_verified && <span className="text-blue-500 text-xs">✓</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[st]}`}>{st}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{u.user_type?.replace(/_/g, ' ') || '—'} · 🔥 {u.current_streak || 0} days</p>
                    </div>
                    <button onClick={() => navigate(`/users/${u.id}`)} className="text-indigo-600 text-xs bg-indigo-50 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
                      View
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">{total} total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 bg-white">← Prev</button>
                <span className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg">{page}</span>
                <button onClick={() => setPage(p => p+1)} disabled={page * limit >= total} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 bg-white">Next →</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

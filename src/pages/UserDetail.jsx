import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [banReason, setBanReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendUntil, setSuspendUntil] = useState('');
  const [showBanForm, setShowBanForm] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setUser(res.data);
    } catch {
      alert('User not found');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const action = async (fn) => {
    setActionLoading(fn.name);
    try { await fn(); await fetchUser(); }
    catch (err) { alert(err.response?.data?.error || err.message); }
    finally { setActionLoading(''); }
  };

  const handleBan = async () => {
    if (!banReason) return alert('Enter a ban reason');
    await action(async function ban() { await api.patch(`/admin/users/${userId}/ban`, { reason: banReason }); });
    setShowBanForm(false); setBanReason('');
  };

  const handleSuspend = async () => {
    if (!suspendReason || !suspendUntil) return alert('Fill all fields');
    await action(async function suspend() { await api.patch(`/admin/users/${userId}/suspend`, { reason: suspendReason, suspend_until: suspendUntil }); });
    setShowSuspendForm(false);
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    await action(async function deleteUser() { await api.delete(`/admin/users/${userId}`); navigate('/users'); });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="space-y-4 lg:space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/users')} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
        ← Back to Users
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=6366f1&color=fff&size=80`}
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl object-cover flex-shrink-0"
            alt=""
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">{user.name || 'No name'}</h2>
              {user.is_verified  && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
              {user.is_admin     && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>}
              {user.is_banned    && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Banned</span>}
              {user.is_suspended && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">Suspended</span>}
            </div>
            <p className="text-gray-400 text-xs mt-1 break-all">{user.id}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
              <span>💪 {user.fitness_level || 'N/A'}</span>
              <span>🔥 {user.current_streak || 0} streak</span>
              <span>📋 {user.total_checkins || 0} check-ins</span>
              <span>💘 {user.total_matches || 0} matches</span>
              {user.city && <span>🏙 {user.city}</span>}
            </div>
            {user.bio && <p className="text-sm text-gray-500 mt-2 italic">"{user.bio}"</p>}
            {user.ban_reason && <p className="text-sm text-red-600 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">Reason: {user.ban_reason}</p>}
            {user.suspension_until && <p className="text-sm text-yellow-700 mt-1 bg-yellow-50 px-3 py-1.5 rounded-lg">Suspended until: {new Date(user.suspension_until).toLocaleDateString()}</p>}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Fitness Goals',  value: user.fitness_goals?.join(', ') || '—' },
          { label: 'Workout Types',  value: user.workout_types?.join(', ') || '—' },
          { label: 'Gender',         value: user.gender || '—' },
          { label: 'Joined',         value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 lg:p-4">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className="text-sm text-gray-800 mt-1 font-medium capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      {user.badges?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">Badges Earned</h3>
          <div className="flex flex-wrap gap-2">
            {user.badges.map(b => (
              <span key={b.badge_type} className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs px-3 py-1.5 rounded-full font-medium">
                🏅 {b.badge_type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      {user.recent_checkins?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">Recent Check-ins</h3>
          <div className="flex flex-wrap gap-2">
            {user.recent_checkins.map(c => (
              <span key={c.date} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-100 font-mono">{c.date}</span>
            ))}
          </div>
        </div>
      )}

      {/* Moderation Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-4">Moderation Actions</h3>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {!user.is_verified && (
            <button onClick={() => action(async function verify() { await api.patch(`/admin/users/${userId}/verify`); })} disabled={!!actionLoading} className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              ✓ Verify
            </button>
          )}
          {!user.is_banned ? (
            <button onClick={() => { setShowBanForm(!showBanForm); setShowSuspendForm(false); }} className="bg-red-600 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              🚫 Ban
            </button>
          ) : (
            <button onClick={() => action(async function unban() { await api.patch(`/admin/users/${userId}/unban`); })} disabled={!!actionLoading} className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              ✅ Unban
            </button>
          )}
          {!user.is_suspended ? (
            <button onClick={() => { setShowSuspendForm(!showSuspendForm); setShowBanForm(false); }} className="bg-yellow-500 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
              ⏸ Suspend
            </button>
          ) : (
            <button onClick={() => action(async function unsuspend() { await api.patch(`/admin/users/${userId}/unsuspend`); })} disabled={!!actionLoading} className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              ▶ Unsuspend
            </button>
          )}
          <button onClick={handleDelete} disabled={!!actionLoading} className="bg-white text-red-600 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors border border-red-200">
            🗑 Delete
          </button>
        </div>

        {showBanForm && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 space-y-3">
            <p className="text-sm font-medium text-red-800">Ban Reason *</p>
            <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Enter reason..." className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white" />
            <div className="flex gap-2">
              <button onClick={handleBan} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Confirm Ban</button>
              <button onClick={() => setShowBanForm(false)} className="bg-white text-gray-600 px-4 py-2 rounded-lg text-sm border border-gray-200">Cancel</button>
            </div>
          </div>
        )}

        {showSuspendForm && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 space-y-3">
            <p className="text-sm font-medium text-yellow-800">Suspend User</p>
            <input value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Reason..." className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white" />
            <input type="date" value={suspendUntil} onChange={e => setSuspendUntil(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white" />
            <div className="flex gap-2">
              <button onClick={handleSuspend} className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">Confirm</button>
              <button onClick={() => setShowSuspendForm(false)} className="bg-white text-gray-600 px-4 py-2 rounded-lg text-sm border border-gray-200">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

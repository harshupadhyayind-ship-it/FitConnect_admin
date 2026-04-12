import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    green:  'bg-green-100 text-green-700 border-green-200',
    red:    'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    blue:   'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray:   'bg-gray-100 text-gray-600 border-gray-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>{children}</span>;
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 font-medium w-36 flex-shrink-0">{label}</span>
    <span className="text-xs text-gray-800 text-right font-medium flex-1">{value || '—'}</span>
  </div>
);

const StatBox = ({ icon, label, value, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue:   'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${colors[color]}`}>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
};

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [banReason, setBanReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendUntil, setSuspendUntil] = useState('');
  const [showBanForm, setShowBanForm] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchUser = async () => {
    try {
      const [userRes, photosRes] = await Promise.allSettled([
        api.get(`/admin/users/${userId}`),
        api.get(`/profiles/${userId}`),
      ]);
      if (userRes.status === 'fulfilled') setUser(userRes.value.data);
      else { alert('User not found'); navigate('/users'); return; }
      if (photosRes.status === 'fulfilled') {
        setPhotos(photosRes.value.data?.photos || []);
      }
    } catch {
      alert('User not found');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const doAction = async (fn, name) => {
    setActionLoading(name);
    try { await fn(); await fetchUser(); }
    catch (err) { alert(err.response?.data?.error || err.message); }
    finally { setActionLoading(''); }
  };

  const handleBan = async () => {
    if (!banReason.trim()) return alert('Enter a ban reason');
    await doAction(() => api.patch(`/admin/users/${userId}/ban`, { reason: banReason }), 'ban');
    setShowBanForm(false); setBanReason('');
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim() || !suspendUntil) return alert('Fill all fields');
    await doAction(() => api.patch(`/admin/users/${userId}/suspend`, { reason: suspendReason, suspend_until: new Date(suspendUntil).toISOString() }), 'suspend');
    setShowSuspendForm(false);
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    await doAction(async () => { await api.delete(`/admin/users/${userId}`); navigate('/users'); }, 'delete');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!user) return null;

  const status = user.is_banned ? 'banned' : user.is_suspended ? 'suspended' : 'active';
  const statusColor = { banned: 'red', suspended: 'yellow', active: 'green' }[status];

  const tabs = ['overview', 'fitness', 'activity', 'photos', 'moderation'];

  return (
    <div className="space-y-4 lg:space-y-6 max-w-5xl">
      {/* Back */}
      <button onClick={() => navigate('/users')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Users
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="px-4 lg:px-6 pb-4 lg:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=6366f1&color=fff&size=120`}
              className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl object-cover border-4 border-white shadow-md flex-shrink-0"
              alt=""
            />
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{user.name || 'No name'}</h2>
                <Badge color={statusColor}>{status}</Badge>
                {user.is_verified && <Badge color="blue">✓ Verified</Badge>}
                {user.is_admin && <Badge color="purple">Admin</Badge>}
              </div>
              <p className="text-xs text-gray-400 font-mono break-all">{user.id}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {user.user_type && <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-lg">👤 {user.user_type}</span>}
                {user.gender && <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-lg">⚧ {user.gender}</span>}
                {user.created_at && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">📅 Joined {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              </div>
            </div>
          </div>
          {user.bio && (
            <p className="mt-4 text-sm text-gray-600 italic bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">"{user.bio}"</p>
          )}
          {user.ban_reason && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 border border-red-100 text-sm">
              <span>🚫</span><span><strong>Ban reason:</strong> {user.ban_reason}</span>
            </div>
          )}
          {user.suspension_until && (
            <div className="mt-3 flex items-start gap-2 bg-yellow-50 text-yellow-700 rounded-xl px-4 py-3 border border-yellow-100 text-sm">
              <span>⏸</span><span><strong>Suspended until:</strong> {new Date(user.suspension_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon="🔥" label="Current Streak" value={user.current_streak || 0} color="orange" />
        <StatBox icon="✅" label="Total Check-ins" value={user.total_checkins || 0} color="green" />
        <StatBox icon="💘" label="Total Matches" value={user.total_matches || 0} color="indigo" />
        <StatBox icon="🏆" label="Longest Streak" value={user.longest_streak || 0} color="blue" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 lg:px-6 py-3 text-sm font-medium whitespace-nowrap capitalize transition-colors flex-shrink-0
                ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-700'}`}
            >
              {{ overview: '📋 Overview', fitness: '💪 Fitness', activity: '📊 Activity', photos: '🖼️ Photos', moderation: '🛡️ Moderation' }[tab]}
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-6">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                <div className="bg-gray-50 rounded-xl px-4 py-1">
                  <InfoRow label="Full Name" value={user.name} />
                  <InfoRow label="User ID" value={<span className="font-mono text-[10px]">{user.id}</span>} />
                  <InfoRow label="User Type" value={<span className="capitalize">{user.user_type}</span>} />
                  <InfoRow label="Gender" value={<span className="capitalize">{user.gender?.replace(/_/g, ' ')}</span>} />
                  <InfoRow label="Date of Birth" value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-IN') : null} />
                  <InfoRow label="Height" value={user.height_cm ? `${user.height_cm} cm` : null} />
                  <InfoRow label="Weight" value={user.weight_kg ? `${user.weight_kg} kg` : null} />
                  <InfoRow label="Joined" value={user.created_at ? new Date(user.created_at).toLocaleString('en-IN') : null} />
                  <InfoRow label="Last Updated" value={user.updated_at ? new Date(user.updated_at).toLocaleString('en-IN') : null} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Status</h3>
                <div className="bg-gray-50 rounded-xl px-4 py-1">
                  <InfoRow label="Status" value={<Badge color={statusColor}>{status}</Badge>} />
                  <InfoRow label="Verified" value={user.is_verified ? <Badge color="blue">✓ Verified</Badge> : <Badge color="gray">Not Verified</Badge>} />
                  <InfoRow label="Admin" value={user.is_admin ? <Badge color="purple">Yes</Badge> : 'No'} />
                  <InfoRow label="Onboarding" value={user.onboarding_completed ? <Badge color="green">Completed</Badge> : <Badge color="yellow">Pending</Badge>} />
                  <InfoRow label="Discovery Filter" value={<span className="capitalize">{user.preferred_gender_filter?.replace(/_/g, ' ')}</span>} />
                </div>

                {user.user_type === 'professional' && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-5">Professional Details</h3>
                    <div className="bg-gray-50 rounded-xl px-4 py-1">
                      <InfoRow label="Specialty" value={user.specialty} />
                      <InfoRow label="Credentials" value={user.credentials?.join(', ')} />
                    </div>
                  </>
                )}

                {(user.latitude && user.longitude) && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-5">Location</h3>
                    <div className="bg-gray-50 rounded-xl px-4 py-1">
                      <InfoRow label="Latitude" value={user.latitude?.toFixed(4)} />
                      <InfoRow label="Longitude" value={user.longitude?.toFixed(4)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── FITNESS TAB ── */}
          {activeTab === 'fitness' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Fitness Profile</h3>
                  <div className="bg-gray-50 rounded-xl px-4 py-1">
                    <InfoRow label="Fitness Level" value={<span className="capitalize">{user.fitness_level}</span>} />
                    <InfoRow label="Height" value={user.height_cm ? `${user.height_cm} cm` : null} />
                    <InfoRow label="Weight" value={user.weight_kg ? `${user.weight_kg} kg` : null} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Fitness Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.fitness_goals?.length > 0
                      ? user.fitness_goals.map(g => <Badge key={g} color="indigo">{g.replace(/_/g, ' ')}</Badge>)
                      : <p className="text-sm text-gray-400">No fitness goals set</p>
                    }
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Workout Types</h3>
                <div className="flex flex-wrap gap-2">
                  {user.workout_types?.length > 0
                    ? user.workout_types.map(w => {
                        const icons = { gym: '🏋️', running: '🏃', yoga: '🧘', swimming: '🏊', cycling: '🚴', horse_riding: '🏇', golf: '⛳', tennis: '🎾', calisthenics: '🤸', badminton: '🏸', climbing: '🧗', volleyball: '🏐' };
                        return <Badge key={w} color="green">{icons[w] || '💪'} {w.replace(/_/g, ' ')}</Badge>;
                      })
                    : <p className="text-sm text-gray-400">No workout types set</p>
                  }
                </div>
              </div>

              {user.badges?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Badges Earned</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map(b => (
                      <div key={b.badge_type} className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-medium">
                        🏅 <span className="capitalize">{b.badge_type.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox icon="🔥" label="Current Streak" value={user.current_streak || 0} color="orange" />
                <StatBox icon="🏆" label="Longest Streak" value={user.longest_streak || 0} color="blue" />
                <StatBox icon="✅" label="Total Check-ins" value={user.total_checkins || 0} color="green" />
                <StatBox icon="💘" label="Matches" value={user.total_matches || 0} color="indigo" />
              </div>

              {user.recent_checkins?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Check-ins</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.recent_checkins.map(c => (
                      <span key={c.date} className="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg border border-green-100 font-mono">
                        ✅ {c.date}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!user.recent_checkins?.length && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-2">📅</p>
                  <p className="text-sm">No check-in history available</p>
                </div>
              )}
            </div>
          )}

          {/* ── PHOTOS TAB ── */}
          {activeTab === 'photos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Profile Photos ({photos.length}/6)</h3>
                {photos.length === 0 && <Badge color="yellow">No photos uploaded</Badge>}
              </div>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 border border-gray-200">
                      <img src={photo.url} alt={`Photo ${photo.position}`} className="w-full h-full object-cover" />
                      {photo.position === 1 && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">⭐ Profile</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2">
                        <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">#{photo.position}</span>
                      </div>
                      <a href={photo.url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white/90 text-gray-800 text-xs px-3 py-1.5 rounded-lg font-medium">View Full</span>
                      </a>
                    </div>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: 6 - photos.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="rounded-xl aspect-square bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <span className="text-gray-300 text-2xl">+</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-gray-400">
                  <p className="text-5xl mb-3">🖼️</p>
                  <p className="text-sm">No photos uploaded yet</p>
                </div>
              )}
            </div>
          )}

          {/* ── MODERATION TAB ── */}
          {activeTab === 'moderation' && (
            <div className="space-y-5">
              {/* Current Status */}
              <div className="flex flex-wrap gap-2">
                <Badge color={statusColor}>{status.toUpperCase()}</Badge>
                {user.is_verified && <Badge color="blue">✓ Verified</Badge>}
                {user.is_admin && <Badge color="purple">Admin</Badge>}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!user.is_verified && (
                  <button
                    onClick={() => doAction(() => api.patch(`/admin/users/${userId}/verify`), 'verify')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {actionLoading === 'verify' ? '...' : '✓ Verify User'}
                  </button>
                )}
                {!user.is_banned ? (
                  <button onClick={() => { setShowBanForm(!showBanForm); setShowSuspendForm(false); }}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
                    🚫 Ban User
                  </button>
                ) : (
                  <button onClick={() => doAction(() => api.patch(`/admin/users/${userId}/unban`), 'unban')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    {actionLoading === 'unban' ? '...' : '✅ Unban User'}
                  </button>
                )}
                {!user.is_suspended ? (
                  <button onClick={() => { setShowSuspendForm(!showSuspendForm); setShowBanForm(false); }}
                    className="flex items-center gap-1.5 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 transition-colors shadow-sm">
                    ⏸ Suspend
                  </button>
                ) : (
                  <button onClick={() => doAction(() => api.patch(`/admin/users/${userId}/unsuspend`), 'unsuspend')} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    {actionLoading === 'unsuspend' ? '...' : '▶ Unsuspend'}
                  </button>
                )}
                <button onClick={handleDelete} disabled={!!actionLoading}
                  className="flex items-center gap-1.5 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors border border-red-200">
                  🗑 Delete Permanently
                </button>
              </div>

              {/* Ban Form */}
              {showBanForm && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-800">🚫 Ban User</p>
                  <textarea
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="Enter reason for ban..."
                    rows={3}
                    className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleBan} disabled={!!actionLoading} className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                      {actionLoading === 'ban' ? 'Banning...' : 'Confirm Ban'}
                    </button>
                    <button onClick={() => setShowBanForm(false)} className="bg-white text-gray-600 px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {/* Suspend Form */}
              {showSuspendForm && (
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 space-y-3">
                  <p className="text-sm font-semibold text-yellow-800">⏸ Suspend User</p>
                  <textarea
                    value={suspendReason}
                    onChange={e => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    rows={2}
                    className="w-full border border-yellow-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white resize-none"
                  />
                  <div>
                    <label className="text-xs text-yellow-700 font-medium block mb-1">Suspend Until</label>
                    <input
                      type="date"
                      value={suspendUntil}
                      onChange={e => setSuspendUntil(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-yellow-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSuspend} disabled={!!actionLoading} className="bg-yellow-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 disabled:opacity-50">
                      {actionLoading === 'suspend' ? 'Suspending...' : 'Confirm Suspend'}
                    </button>
                    <button onClick={() => setShowSuspendForm(false)} className="bg-white text-gray-600 px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="border border-red-100 rounded-xl p-4 mt-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Danger Zone</p>
                <p className="text-xs text-gray-500 mb-3">Permanently deletes the user, their profile, matches, messages and all associated data. This action cannot be undone.</p>
                <button onClick={handleDelete} disabled={!!actionLoading}
                  className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {actionLoading === 'delete' ? 'Deleting...' : '🗑 Delete User Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useDialog } from '../components/Dialog';

/* ── Small reusable atoms ─────────────────────────────────────── */
const Badge = ({ children, color = 'gray' }) => {
  const c = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    red:    'bg-rose-50 text-rose-700 border-rose-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-violet-50 text-violet-700 border-violet-100',
    gray:   'bg-gray-100 text-gray-500 border-gray-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c[color]}`}>{children}</span>;
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 font-medium w-36 flex-shrink-0">{label}</span>
    <span className="text-xs text-gray-800 text-right font-medium flex-1">{value ?? '—'}</span>
  </div>
);

const StatBox = ({ icon, label, value, color = 'indigo' }) => {
  const c = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-500',
    blue:   'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${c[color]}`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
};

/* ── SVG icon helpers ─────────────────────────────────────────── */
const Icon = ({ d, className = 'w-4 h-4', fill = false }) => (
  <svg viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const FlameIcon   = () => <Icon className="w-5 h-5" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>;
const CheckIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>;
const HeartIcon   = () => <Icon className="w-5 h-5" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>;
const TrophyIcon  = () => <Icon className="w-5 h-5" d={['M6 9H4.5a2.5 2.5 0 0 1 0-5H6','M18 9h1.5a2.5 2.5 0 0 0 0-5H18','M4 22h16','M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22','M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22','M18 2H6v7a6 6 0 0 0 12 0V2z']}/>;

/* ── Main component ───────────────────────────────────────────── */
export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useDialog();
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
      const res = await api.get(`/admin/users/${userId}`);
      setUser(res.data);
      setPhotos(res.data.photos || []);
    } catch {
      await showAlert('User not found or could not be loaded.', { title: 'Not Found', variant: 'error' });
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const doAction = async (fn, name) => {
    setActionLoading(name);
    try { await fn(); await fetchUser(); }
    catch (err) { showAlert(err.response?.data?.error || err.message, { title: 'Action Failed', variant: 'error' }); }
    finally { setActionLoading(''); }
  };

  const handleBan = async () => {
    if (!banReason.trim()) return showAlert('Please enter a reason for the ban.', { title: 'Reason Required', variant: 'warning' });
    await doAction(() => api.patch(`/admin/users/${userId}/ban`, { reason: banReason }), 'ban');
    setShowBanForm(false); setBanReason('');
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim() || !suspendUntil) return showAlert('Please fill in both the reason and suspension end date.', { title: 'Fields Required', variant: 'warning' });
    await doAction(() => api.patch(`/admin/users/${userId}/suspend`, { reason: suspendReason, suspend_until: new Date(suspendUntil).toISOString() }), 'suspend');
    setShowSuspendForm(false);
  };

  const handleDelete = async () => {
    const ok = await showConfirm('This will permanently remove the user, their profile, matches, and all data. This cannot be undone.', {
      title: 'Delete Account',
      variant: 'danger',
      confirmText: 'Yes, Delete',
    });
    if (!ok) return;
    await doAction(async () => { await api.delete(`/admin/users/${userId}`); navigate('/users'); }, 'delete');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-indigo-600"></div>
    </div>
  );
  if (!user) return null;

  const status = user.is_banned ? 'banned' : user.is_suspended ? 'suspended' : 'active';
  const statusColor = { banned: 'red', suspended: 'yellow', active: 'green' }[status];

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'fitness',    label: 'Fitness',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
    { id: 'activity',   label: 'Activity',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: 'photos',     label: 'Photos',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { id: 'moderation', label: 'Moderation', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <button onClick={() => navigate('/users')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Users
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner — avatar overlaps bottom edge */}
        <div className="h-24 sm:h-28 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'40px 40px'}}/>
          {/* Avatar pinned to bottom-left of banner */}
          <div className="absolute -bottom-10 left-4 sm:left-6">
            <div className="relative">
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=6366f1&color=fff&size=160`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                alt=""
              />
              <span className={`absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full ring-2 ring-white ${
                status === 'active' ? 'bg-emerald-500' : status === 'banned' ? 'bg-rose-500' : 'bg-amber-400'
              }`}/>
            </div>
          </div>
        </div>

        {/* Name row — always on white background */}
        <div className="pt-12 sm:pt-14 px-4 sm:px-6 pb-4 sm:pb-5">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{user.name || 'No name'}</h2>
            <Badge color={statusColor}>{status}</Badge>
            {user.is_verified && <Badge color="blue">Verified</Badge>}
            {user.is_admin    && <Badge color="purple">Admin</Badge>}
          </div>

          {/* Contact info */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mt-1.5 mb-3">
            {user.email && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {user.phone}
              </span>
            )}
            {!user.email && !user.phone && (
              <span className="text-xs text-gray-400">No contact info</span>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-xs">{user.id}</span>
            {user.user_type && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 capitalize bg-gray-100 px-2.5 py-1 rounded-lg">{user.user_type}</span>
            )}
            {user.gender && (
              <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2.5 py-1 rounded-lg">{user.gender.replace(/_/g,' ')}</span>
            )}
            {user.created_at && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Joined {new Date(user.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="mt-3 text-sm text-gray-500 italic bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">"{user.bio}"</p>
          )}
          {user.ban_reason && (
            <div className="mt-3 flex items-start gap-2 bg-rose-50 text-rose-700 rounded-xl px-4 py-3 border border-rose-100 text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              <span><strong>Ban reason:</strong> {user.ban_reason}</span>
            </div>
          )}
          {user.suspension_until && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 text-amber-700 rounded-xl px-4 py-3 border border-amber-100 text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
              <span><strong>Suspended until:</strong> {new Date(user.suspension_until).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatBox icon={<FlameIcon/>}  label="Current Streak"  value={user.current_streak || 0}  color="orange"/>
        <StatBox icon={<CheckIcon/>}  label="Total Check-ins" value={user.total_checkins || 0}   color="green"/>
        <StatBox icon={<HeartIcon/>}  label="Total Matches"   value={user.total_matches || 0}    color="indigo"/>
        <StatBox icon={<TrophyIcon/>} label="Longest Streak"  value={user.longest_streak || 0}   color="blue"/>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar — scrollable on mobile, shows icons-only on xs */}
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-none">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50/60'
              }`}>
              {tab.icon}
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Information</p>
                <div className="bg-gray-50 rounded-xl px-4 py-1">
                  <InfoRow label="Full Name"    value={user.name}/>
                  <InfoRow label="Email"        value={user.email}/>
                  <InfoRow label="Phone"        value={user.phone}/>
                  <InfoRow label="User ID"      value={<span className="font-mono text-[10px] break-all">{user.id}</span>}/>
                  <InfoRow label="User Type"    value={<span className="capitalize">{user.user_type}</span>}/>
                  <InfoRow label="Gender"       value={<span className="capitalize">{user.gender?.replace(/_/g,' ')}</span>}/>
                  <InfoRow label="Date of Birth" value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-IN') : null}/>
                  <InfoRow label="Height"       value={user.height_cm ? `${user.height_cm} cm` : null}/>
                  <InfoRow label="Weight"       value={user.weight_kg ? `${user.weight_kg} kg` : null}/>
                  <InfoRow label="Joined"       value={user.created_at ? new Date(user.created_at).toLocaleString('en-IN') : null}/>
                  <InfoRow label="Last Updated" value={user.updated_at ? new Date(user.updated_at).toLocaleString('en-IN') : null}/>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account Status</p>
                <div className="bg-gray-50 rounded-xl px-4 py-1">
                  <InfoRow label="Status"    value={<Badge color={statusColor}>{status}</Badge>}/>
                  <InfoRow label="Verified"  value={user.is_verified ? <Badge color="blue">Verified</Badge> : <Badge color="gray">Not Verified</Badge>}/>
                  <InfoRow label="Admin"     value={user.is_admin ? <Badge color="purple">Yes</Badge> : 'No'}/>
                  <InfoRow label="Onboarding" value={user.onboarding_completed ? <Badge color="green">Completed</Badge> : <Badge color="yellow">Pending</Badge>}/>
                  <InfoRow label="Discovery Filter" value={<span className="capitalize">{user.preferred_gender_filter?.replace(/_/g,' ')}</span>}/>
                </div>

                {user.user_type === 'professional' && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-5">Professional Details</p>
                    <div className="bg-gray-50 rounded-xl px-4 py-1">
                      <InfoRow label="Specialty"   value={user.specialty}/>
                      <InfoRow label="Credentials" value={user.credentials?.join(', ')}/>
                    </div>
                  </>
                )}

                {(user.latitude && user.longitude) && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-5">Location</p>
                    <div className="bg-gray-50 rounded-xl px-4 py-1">
                      <InfoRow label="Latitude"  value={user.latitude?.toFixed(4)}/>
                      <InfoRow label="Longitude" value={user.longitude?.toFixed(4)}/>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── FITNESS ── */}
          {activeTab === 'fitness' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Fitness Profile</p>
                  <div className="bg-gray-50 rounded-xl px-4 py-1">
                    <InfoRow label="Fitness Level" value={<span className="capitalize">{user.fitness_level}</span>}/>
                    <InfoRow label="Height" value={user.height_cm ? `${user.height_cm} cm` : null}/>
                    <InfoRow label="Weight" value={user.weight_kg ? `${user.weight_kg} kg` : null}/>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Fitness Goals</p>
                  <div className="flex flex-wrap gap-2">
                    {user.fitness_goals?.length > 0
                      ? user.fitness_goals.map(g => <Badge key={g} color="indigo">{g.replace(/_/g,' ')}</Badge>)
                      : <p className="text-sm text-gray-400">No fitness goals set</p>
                    }
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Workout Types</p>
                <div className="flex flex-wrap gap-2">
                  {user.workout_types?.length > 0
                    ? user.workout_types.map(w => <Badge key={w} color="green">{w.replace(/_/g,' ')}</Badge>)
                    : <p className="text-sm text-gray-400">No workout types set</p>
                  }
                </div>
              </div>
              {user.badges?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Badges Earned</p>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map(b => (
                      <div key={b.badge_type} className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                        <span className="capitalize">{b.badge_type.replace(/_/g,' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox icon={<FlameIcon/>}  label="Current Streak"  value={user.current_streak || 0}  color="orange"/>
                <StatBox icon={<TrophyIcon/>} label="Longest Streak"  value={user.longest_streak || 0}  color="blue"/>
                <StatBox icon={<CheckIcon/>}  label="Total Check-ins" value={user.total_checkins || 0}   color="green"/>
                <StatBox icon={<HeartIcon/>}  label="Matches"         value={user.total_matches || 0}    color="indigo"/>
              </div>
              {user.recent_checkins?.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Check-ins</p>
                  <div className="flex flex-wrap gap-2">
                    {user.recent_checkins.map(c => (
                      <span key={c.date} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg border border-emerald-100 font-mono">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
                        {c.date}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-200 mx-auto mb-2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p className="text-sm">No check-in history available</p>
                </div>
              )}
            </div>
          )}

          {/* ── PHOTOS ── */}
          {activeTab === 'photos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Profile Photos</p>
                  <p className="text-xs text-gray-400 mt-0.5">{photos.length} of 6 slots used</p>
                </div>
                {photos.length === 0 && <Badge color="yellow">No photos uploaded</Badge>}
              </div>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 border border-gray-200">
                      <img src={photo.url} alt={`Photo ${photo.position}`} className="w-full h-full object-cover"/>

                      {/* Profile badge */}
                      {photo.position === 1 && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">Profile</span>
                        </div>
                      )}

                      {/* Position number */}
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">#{photo.position}</span>
                      </div>

                      {/* Hover overlay — View + Delete */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <a href={photo.url} target="_blank" rel="noreferrer"
                          className="bg-white/90 text-gray-800 text-xs px-3 py-1.5 rounded-lg font-medium shadow hover:bg-white transition-colors">
                          View Full
                        </a>
                        <button
                          onClick={async () => {
                            const ok = await showConfirm('Delete this photo? This cannot be undone.', {
                              title: 'Delete Photo',
                              variant: 'danger',
                              confirmText: 'Delete',
                            });
                            if (!ok) return;
                            try {
                              await api.delete(`/admin/users/${userId}/photos/${photo.id}`);
                              await fetchUser();
                            } catch (err) {
                              showAlert(err.response?.data?.error || err.message, { title: 'Delete Failed', variant: 'error' });
                            }
                          }}
                          className="bg-rose-600/90 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow hover:bg-rose-600 transition-colors flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: 6 - photos.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="rounded-xl aspect-square bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-300">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="text-[10px] text-gray-300">Empty</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-200 mx-auto mb-3">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-sm">No photos uploaded yet</p>
                </div>
              )}
            </div>
          )}

          {/* ── MODERATION ── */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">

              {/* Current status row */}
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current status</span>
                <Badge color={statusColor}>{status}</Badge>
                {user.is_verified && <Badge color="blue">Verified</Badge>}
                {user.is_admin    && <Badge color="purple">Admin</Badge>}
              </div>

              {/* Action rows */}
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">

                {/* Verify */}
                {!user.is_verified && (
                  <div className="flex items-center justify-between gap-4 p-4 bg-white hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Verify User</p>
                        <p className="text-xs text-gray-400 mt-0.5">Mark this account as verified. Verified badge will appear on their profile.</p>
                      </div>
                    </div>
                    <button onClick={() => doAction(() => api.patch(`/admin/users/${userId}/verify`), 'verify')} disabled={!!actionLoading}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                      {actionLoading === 'verify' ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                )}

                {/* Promote / Revoke Admin */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${user.is_admin ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-600'}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.is_admin ? 'Revoke Admin' : 'Promote to Admin'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {user.is_admin
                          ? 'Remove admin privileges. This user will lose access to the admin panel.'
                          : 'Grant full admin access. This user will be able to manage the platform.'}
                      </p>
                    </div>
                  </div>
                  {user.is_admin ? (
                    <button
                      onClick={async () => {
                        const ok = await showConfirm('Remove admin privileges from this user? They will lose access to the admin panel.', {
                          title: 'Revoke Admin',
                          variant: 'danger',
                          confirmText: 'Revoke',
                        });
                        if (!ok) return;
                        doAction(() => api.patch(`/admin/users/${userId}/revoke-admin`), 'revoke-admin');
                      }}
                      disabled={!!actionLoading}
                      className="flex-shrink-0 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                      {actionLoading === 'revoke-admin' ? 'Revoking…' : 'Revoke Admin'}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        const ok = await showConfirm('Promote this user to admin? They will gain full platform management access.', {
                          title: 'Promote to Admin',
                          variant: 'warning',
                          confirmText: 'Promote',
                        });
                        if (!ok) return;
                        doAction(() => api.patch(`/admin/users/${userId}/promote-admin`), 'promote-admin');
                      }}
                      disabled={!!actionLoading}
                      className="flex-shrink-0 bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                      {actionLoading === 'promote-admin' ? 'Promoting…' : 'Promote to Admin'}
                    </button>
                  )}
                </div>

                {/* Ban / Unban */}
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${user.is_banned ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          {user.is_banned ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.is_banned ? 'Unban User' : 'Ban User'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {user.is_banned ? 'Restore access. The user will be able to sign in again.' : 'Block access immediately. Their Firebase session will be revoked.'}
                        </p>
                      </div>
                    </div>
                    {user.is_banned ? (
                      <button onClick={() => doAction(() => api.patch(`/admin/users/${userId}/unban`), 'unban')} disabled={!!actionLoading}
                        className="flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                        {actionLoading === 'unban' ? 'Unbanning…' : 'Unban'}
                      </button>
                    ) : (
                      <button onClick={() => { setShowBanForm(!showBanForm); setShowSuspendForm(false); }}
                        className="flex-shrink-0 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                        {showBanForm ? 'Cancel' : 'Ban'}
                      </button>
                    )}
                  </div>
                  {showBanForm && (
                    <div className="mt-3 ml-11 space-y-2">
                      <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                        placeholder="Reason for ban (required)…" rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-gray-50"/>
                      <button onClick={handleBan} disabled={!!actionLoading}
                        className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors">
                        {actionLoading === 'ban' ? 'Banning…' : 'Confirm Ban'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Suspend / Unsuspend */}
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${user.is_suspended ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          {user.is_suspended
                            ? <polygon points="5 3 19 12 5 21 5 3"/>
                            : <><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></>}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.is_suspended ? 'Unsuspend User' : 'Suspend User'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {user.is_suspended ? 'Lift the temporary suspension and restore access.' : 'Temporarily restrict access until a specific date.'}
                        </p>
                      </div>
                    </div>
                    {user.is_suspended ? (
                      <button onClick={() => doAction(() => api.patch(`/admin/users/${userId}/unsuspend`), 'unsuspend')} disabled={!!actionLoading}
                        className="flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors whitespace-nowrap">
                        {actionLoading === 'unsuspend' ? 'Lifting…' : 'Unsuspend'}
                      </button>
                    ) : (
                      <button onClick={() => { setShowSuspendForm(!showSuspendForm); setShowBanForm(false); }}
                        className="flex-shrink-0 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                        {showSuspendForm ? 'Cancel' : 'Suspend'}
                      </button>
                    )}
                  </div>
                  {showSuspendForm && (
                    <div className="mt-3 ml-11 space-y-2">
                      <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                        placeholder="Reason for suspension (required)…" rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none bg-gray-50"/>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">Suspend until</label>
                        <input type="date" value={suspendUntil} onChange={e => setSuspendUntil(e.target.value)} min={new Date().toISOString().split('T')[0]}
                          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"/>
                      </div>
                      <button onClick={handleSuspend} disabled={!!actionLoading}
                        className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
                        {actionLoading === 'suspend' ? 'Suspending…' : 'Confirm Suspend'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-rose-100 overflow-hidden">
                <div className="bg-rose-50/60 px-4 py-3 border-b border-rose-100">
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Danger Zone</p>
                </div>
                <div className="flex items-center justify-between gap-4 p-4 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Delete Account</p>
                      <p className="text-xs text-gray-400 mt-0.5">Permanently remove this user, their profile, matches, messages and all data. This cannot be undone.</p>
                    </div>
                  </div>
                  <button onClick={handleDelete} disabled={!!actionLoading}
                    className="flex-shrink-0 bg-white text-rose-600 border border-rose-300 hover:bg-rose-600 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-all whitespace-nowrap">
                    {actionLoading === 'delete' ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

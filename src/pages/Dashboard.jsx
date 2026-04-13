import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../config/api';
import StatCard from '../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const tooltipStyle = {
  backgroundColor: '#1e1b4b', titleColor: '#e0e7ff', bodyColor: '#c7d2fe', padding: 10, cornerRadius: 8,
};
const lineOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: tooltipStyle },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#9ca3af', precision: 0, stepSize: 1 }, beginAtZero: true },
  },
  elements: { line: { tension: 0.4 }, point: { radius: 3, hoverRadius: 5 } },
};
const barOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: tooltipStyle },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#9ca3af', precision: 0, stepSize: 1 }, beginAtZero: true },
  },
  borderRadius: 6,
};
const doughnutOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 16 } }, tooltip: tooltipStyle },
  cutout: '65%',
};

function MetricChange({ current, previous }) {
  if (!previous || previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [dau, setDau] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [retention, setRetention] = useState(null);
  const [matchStats, setMatchStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/analytics/overview'),
      api.get(`/admin/analytics/dau?days=${days}`),
      api.get(`/admin/analytics/growth?days=${days}`),
      api.get('/admin/analytics/retention'),
      api.get(`/admin/analytics/matches?days=${days}`),
    ]).then(([ov, dauRes, growthRes, retRes, matchRes]) => {
      setOverview(ov.data);
      setDau(dauRes.data.data || []);
      setGrowth(growthRes.data.data || []);
      setRetention(retRes.data);
      setMatchStats(matchRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [days]);

  const dauChart = {
    labels: dau.map(d => d.date?.slice(5)),
    datasets: [{
      label: 'Active Users', data: dau.map(d => d.count),
      borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, borderWidth: 2,
    }],
  };

  const growthChart = {
    labels: growth.map(d => d.date?.slice(5)),
    datasets: [{
      label: 'New Users', data: growth.map(d => d.count),
      backgroundColor: 'rgba(99,102,241,0.8)', hoverBackgroundColor: '#4f46e5', borderWidth: 0,
    }],
  };

  const matchChart = {
    labels: matchStats.map(d => d.date?.slice(5)),
    datasets: [{
      label: 'Matches', data: matchStats.map(d => d.count),
      backgroundColor: 'rgba(236,72,153,0.75)', hoverBackgroundColor: '#db2777', borderWidth: 0,
    }],
  };

  const userTypeChart = {
    labels: ['Individual', 'Professional', 'Banned', 'Verified'],
    datasets: [{
      data: [
        (overview?.total_users || 0) - (overview?.banned_users || 0),
        0,
        overview?.banned_users || 0,
        overview?.verified_users || 0,
      ],
      backgroundColor: ['#6366f1', '#8b5cf6', '#ef4444', '#10b981'],
      borderWidth: 0,
    }],
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  const totalDau    = dau.reduce((s, d) => s + (d.count || 0), 0);
  const totalGrowth = growth.reduce((s, d) => s + (d.count || 0), 0);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Platform overview · Updated {overview?.as_of ? new Date(overview.as_of).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'now'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Users"    value={overview?.total_users?.toLocaleString()}  icon="users"    color="indigo" subtitle="All registered"  onClick={() => navigate('/users')} />
        <StatCard title="Active Today"   value={overview?.active_today?.toLocaleString()}  icon="fire"     color="green"  subtitle="Checked in today" onClick={() => navigate('/users?status=active_today')} />
        <StatCard title="New This Week"  value={overview?.new_this_week?.toLocaleString()} icon="trending" color="blue"   subtitle="New signups"       onClick={() => navigate('/users?status=new_this_week')} />
        <StatCard title="Monthly Active" value={overview?.mau?.toLocaleString()}           icon="calendar" color="purple" subtitle="MAU this month"    onClick={() => navigate('/users?status=monthly_active')} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Matches"  value={overview?.total_matches?.toLocaleString()}  icon="heart"    color="purple" onClick={() => navigate('/users?status=has_matches')} />
        <StatCard title="Total Messages" value={overview?.total_messages?.toLocaleString()} icon="message"  color="yellow" onClick={() => navigate('/moderation')} />
        <StatCard title="Banned Users"   value={overview?.banned_users}                     icon="ban"      color="red"    onClick={() => navigate('/users?status=banned')} />
        <StatCard title="Verified Users" value={overview?.verified_users}                   icon="verified" color="green"  onClick={() => navigate('/users?status=verified')} />
      </div>

      {/* Charts Row 1 — DAU + Growth */}
      {/* Charts Row 1 — DAU + Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Daily Active Users</h2>
              <p className="text-xs text-gray-400">Last {days} days</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium border border-indigo-100">{totalDau.toLocaleString()} total</span>
          </div>
          <div className="h-44 sm:h-52">
            <Line data={dauChart} options={lineOpts} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">User Growth</h2>
              <p className="text-xs text-gray-400">New signups — last {days} days</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium border border-emerald-100">+{totalGrowth.toLocaleString()} new</span>
          </div>
          <div className="h-44 sm:h-52">
            <Bar data={growthChart} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 — Matches + Retention + Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Match Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Match Activity</h2>
            <p className="text-xs text-gray-400">Last {days} days</p>
          </div>
          <div className="h-40 sm:h-44">
            <Bar data={matchChart} options={barOpts} />
          </div>
        </div>

        {/* Retention */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Retention</h2>
            <p className="text-xs text-gray-400">User cohort retention</p>
          </div>
          <div className="space-y-4 mt-2">
            {[
              { label: 'Day 1',  value: retention?.d1,  color: 'bg-indigo-500' },
              { label: 'Day 7',  value: retention?.d7,  color: 'bg-violet-500' },
              { label: 'Day 30', value: retention?.d30, color: 'bg-pink-500'   },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">{r.label} Retention</span>
                  <span className="font-semibold text-gray-700">{r.value != null ? `${r.value}%` : '—'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${r.color} transition-all duration-500`} style={{ width: `${r.value || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:col-span-2 lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">User Breakdown</h2>
            <p className="text-xs text-gray-400">Platform composition</p>
          </div>
          <div className="h-40 sm:h-44">
            <Doughnut data={userTypeChart} options={doughnutOpts} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'View All Users', to: '/users',
              color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            },
            {
              label: 'Pending Reports', to: '/moderation',
              color: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
            },
            {
              label: 'Create Event', to: '/events',
              color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
            },
            {
              label: 'Send Broadcast', to: '/broadcast',
              color: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
            },
          ].map(a => (
            <button key={a.to} onClick={() => navigate(a.to)}
              className={`flex flex-col items-center gap-2 py-4 sm:py-5 rounded-xl text-xs font-semibold transition-colors ${a.color}`}>
              {a.icon}
              <span className="text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

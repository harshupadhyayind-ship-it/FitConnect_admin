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
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#9ca3af' }, beginAtZero: true },
  },
  elements: { line: { tension: 0.4 }, point: { radius: 3, hoverRadius: 5 } },
};
const barOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: tooltipStyle },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#9ca3af' }, beginAtZero: true },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Platform overview · Updated {overview?.as_of ? new Date(overview.as_of).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'now'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${days === d ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Users"   value={overview?.total_users?.toLocaleString()}  icon="👥" color="indigo" subtitle="All registered"   onClick={() => navigate('/users')} />
        <StatCard title="Active Today"  value={overview?.active_today?.toLocaleString()}  icon="🔥" color="green"  subtitle="Checked in today"  onClick={() => navigate('/users')} />
        <StatCard title="New This Week" value={overview?.new_this_week?.toLocaleString()} icon="📈" color="blue"   subtitle="New signups"        onClick={() => navigate('/users')} />
        <StatCard title="Monthly Active" value={overview?.mau?.toLocaleString()}          icon="📅" color="purple" subtitle="MAU this month"     onClick={() => navigate('/users')} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Matches"  value={overview?.total_matches?.toLocaleString()}  icon="💘" color="purple" onClick={() => navigate('/users')} />
        <StatCard title="Total Messages" value={overview?.total_messages?.toLocaleString()} icon="💬" color="yellow" onClick={() => navigate('/moderation')} />
        <StatCard title="Banned Users"   value={overview?.banned_users}                     icon="🚫" color="red"    onClick={() => navigate('/users')} />
        <StatCard title="Verified Users" value={overview?.verified_users}                   icon="✅" color="green"  onClick={() => navigate('/users')} />
      </div>

      {/* Charts Row 1 — DAU + Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Daily Active Users</h2>
              <p className="text-xs text-gray-400">Last {days} days</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">{totalDau.toLocaleString()} total</span>
          </div>
          <div className="h-48 lg:h-56">
            <Line data={dauChart} options={lineOpts} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">User Growth</h2>
              <p className="text-xs text-gray-400">New signups — last {days} days</p>
            </div>
            <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">+{totalGrowth.toLocaleString()} new</span>
          </div>
          <div className="h-48 lg:h-56">
            <Bar data={growthChart} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 — Matches + Retention + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Match Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Match Activity</h2>
            <p className="text-xs text-gray-400">Last {days} days</p>
          </div>
          <div className="h-44">
            <Bar data={matchChart} options={barOpts} />
          </div>
        </div>

        {/* Retention */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Retention</h2>
            <p className="text-xs text-gray-400">User cohort retention</p>
          </div>
          <div className="space-y-3 mt-2">
            {[
              { label: 'Day 1 Retention',  value: retention?.d1, color: 'bg-indigo-500' },
              { label: 'Day 7 Retention',  value: retention?.d7, color: 'bg-purple-500' },
              { label: 'Day 30 Retention', value: retention?.d30, color: 'bg-pink-500' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{r.label}</span>
                  <span className="font-semibold text-gray-700">{r.value != null ? `${r.value}%` : '—'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${r.color} transition-all`} style={{ width: `${r.value || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Breakdown Doughnut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">User Breakdown</h2>
            <p className="text-xs text-gray-400">Platform composition</p>
          </div>
          <div className="h-44">
            <Doughnut data={userTypeChart} options={doughnutOpts} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View All Users',    icon: '👥', to: '/users',      color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
            { label: 'Pending Reports',   icon: '🛡️', to: '/moderation', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
            { label: 'Create Event',      icon: '🏆', to: '/events',     color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { label: 'Send Broadcast',    icon: '📢', to: '/broadcast',  color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
          ].map(a => (
            <button key={a.to} onClick={() => navigate(a.to)}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl text-xs font-semibold transition-colors ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

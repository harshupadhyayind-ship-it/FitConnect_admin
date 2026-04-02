import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../config/api';
import StatCard from '../components/StatCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e1b4b',
      titleColor: '#e0e7ff',
      bodyColor: '#c7d2fe',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' },
    },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 11 }, color: '#9ca3af' },
      beginAtZero: true,
    },
  },
  elements: {
    line: { tension: 0.4 },
    point: { radius: 3, hoverRadius: 5 },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e1b4b',
      titleColor: '#e0e7ff',
      bodyColor: '#c7d2fe',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' },
    },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 11 }, color: '#9ca3af' },
      beginAtZero: true,
    },
  },
  borderRadius: 6,
};

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [dau, setDau] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/overview'),
      api.get('/admin/analytics/dau?days=14'),
      api.get('/admin/analytics/growth?days=14'),
    ]).then(([ov, dauRes, growthRes]) => {
      setOverview(ov.data);
      setDau(dauRes.data.data || []);
      setGrowth(growthRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const dauChartData = {
    labels: dau.map(d => d.date?.slice(5)),
    datasets: [
      {
        label: 'Active Users',
        data: dau.map(d => d.count),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const growthChartData = {
    labels: growth.map(d => d.date?.slice(5)),
    datasets: [
      {
        label: 'New Users',
        data: growth.map(d => d.count),
        backgroundColor: 'rgba(99,102,241,0.8)',
        hoverBackgroundColor: '#4f46e5',
        borderWidth: 0,
      },
    ],
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Total Users"   value={overview?.total_users?.toLocaleString()}  icon="👥" color="indigo" subtitle="All registered"  onClick={() => navigate('/users')} />
        <StatCard title="Active Today"  value={overview?.active_today?.toLocaleString()}  icon="🔥" color="green"  subtitle="Checked in today" onClick={() => navigate('/users')} />
        <StatCard title="Total Matches" value={overview?.total_matches?.toLocaleString()} icon="💘" color="purple" subtitle="Connections"       onClick={() => navigate('/users')} />
        <StatCard title="New This Week" value={overview?.new_this_week?.toLocaleString()} icon="📈" color="blue"   subtitle="New signups"       onClick={() => navigate('/users')} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        <StatCard title="Banned"   value={overview?.banned_users}                     icon="🚫" color="red"    onClick={() => navigate('/users?status=banned')} />
        <StatCard title="Verified" value={overview?.verified_users}                   icon="✅" color="green"  onClick={() => navigate('/users')} />
        <StatCard title="Messages" value={overview?.total_messages?.toLocaleString()} icon="💬" color="yellow" onClick={() => navigate('/moderation')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* DAU Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm lg:text-base font-semibold text-gray-900">Daily Active Users</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 14 days</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
              {dau.reduce((s, d) => s + (d.count || 0), 0).toLocaleString()} total
            </span>
          </div>
          <div className="h-52">
            <Line data={dauChartData} options={lineOptions} />
          </div>
        </div>

        {/* Growth Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm lg:text-base font-semibold text-gray-900">User Growth</h2>
              <p className="text-xs text-gray-400 mt-0.5">New signups — last 14 days</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
              {growth.reduce((s, d) => s + (d.count || 0), 0).toLocaleString()} new
            </span>
          </div>
          <div className="h-52">
            <Bar data={growthChartData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

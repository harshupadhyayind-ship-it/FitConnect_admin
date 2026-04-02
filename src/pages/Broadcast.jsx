import { useState, useEffect } from 'react';
import api from '../config/api';

const initialForm = { title: '', body: '', user_type: '', fitness_level: '', platform: '' };

export default function Broadcast() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = () => {
    setLoadingHistory(true);
    api.get('/admin/notifications/broadcast/history')
      .then(res => setHistory(res.data.broadcasts || []))
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async () => {
    if (!form.title || !form.body) return alert('Title and message are required');
    setSending(true);
    setResult(null);
    try {
      const payload = { title: form.title, body: form.body };
      const filters = {};
      if (form.user_type) filters.user_type = form.user_type;
      if (form.fitness_level) filters.fitness_level = form.fitness_level;
      if (form.platform) filters.platform = form.platform;
      if (Object.keys(filters).length > 0) payload.filters = filters;

      const res = await api.post('/admin/notifications/broadcast', payload);
      setResult(res.data);
      setForm(initialForm);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Broadcast Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Send push notifications to all or filtered users</p>
      </div>

      {/* Compose Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 space-y-4 lg:space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Compose Notification</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. New Challenge Available!"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
          <textarea
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            rows={4}
            placeholder="Write your notification message..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.body.length} characters</p>
        </div>

        {/* Filters */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Target Audience <span className="text-gray-400 font-normal">(leave empty to send to all users)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">User Type</label>
              <select
                value={form.user_type}
                onChange={e => setForm(p => ({ ...p, user_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Types</option>
                <option value="individual">Individual</option>
            <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fitness Level</label>
              <select
                value={form.fitness_level}
                onChange={e => setForm(p => ({ ...p, fitness_level: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Platforms</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.body) && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-2">PREVIEW</p>
            <div className="bg-white rounded-xl p-3 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🏋️</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{form.title || 'Notification Title'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{form.body || 'Notification message...'}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
        >
          {sending ? '📤 Sending...' : '📢 Send Notification'}
        </button>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            ✅ Successfully sent to <strong>{result.sent_count || 0}</strong> devices.
            {result.failed_count > 0 && <span className="text-orange-600 ml-2">({result.failed_count} failed)</span>}
          </div>
        )}
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Broadcast History</h2>
          <button onClick={fetchHistory} className="text-xs text-indigo-600 hover:text-indigo-800">Refresh</button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.length === 0 && (
              <p className="text-center text-gray-400 py-10 text-sm">No broadcasts sent yet</p>
            )}
            {history.map((b, i) => (
              <div key={b.id || i} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{b.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{b.body}</p>
                  {b.filters && Object.keys(b.filters).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {Object.entries(b.filters).map(([k, v]) => (
                        <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{k}: {v}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">📤 {b.sent_count || 0} sent</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

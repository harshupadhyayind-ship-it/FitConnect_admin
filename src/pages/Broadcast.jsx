import { useState, useEffect } from 'react';
import api from '../config/api';
import { useDialog } from '../components/Dialog';
import CustomSelect from '../components/CustomSelect';

const initialForm = { title: '', body: '', user_type: '', fitness_level: '', platform: '' };

export default function Broadcast() {
  const { showAlert } = useDialog();
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
    if (!form.title || !form.body) return showAlert('Both a title and a message body are required before sending.', { title: 'Required Fields', variant: 'warning' });
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
      showAlert(err.response?.data?.error || err.message, { title: 'Broadcast Failed', variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Broadcast</h1>
        <p className="text-gray-400 text-sm mt-0.5">Send push notifications to all or filtered users</p>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Compose Notification</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. New Challenge Available!"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message *</label>
          <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            rows={4} placeholder="Write your notification message..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"/>
          <p className="text-xs text-gray-400 mt-1">{form.body.length} characters</p>
        </div>

        {/* Filters */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Target Audience
            <span className="normal-case font-normal text-gray-400 ml-1">— leave empty to send to all</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                key: 'user_type', label: 'User Type',
                options: [
                  { value: '', label: 'All Types' },
                  { value: 'individual', label: 'Individual' },
                  { value: 'professional', label: 'Professional' },
                ],
              },
              {
                key: 'fitness_level', label: 'Fitness Level',
                options: [
                  { value: '', label: 'All Levels' },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                ],
              },
              {
                key: 'platform', label: 'Platform',
                options: [
                  { value: '', label: 'All Platforms' },
                  { value: 'android', label: 'Android' },
                  { value: 'ios', label: 'iOS' },
                ],
              },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                <CustomSelect
                  value={form[f.key]}
                  onChange={val => setForm(p => ({ ...p, [f.key]: val }))}
                  options={f.options}
                  placeholder={f.options[0].label}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.body) && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Preview</p>
            <div className="bg-white rounded-xl p-3 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{form.title || 'Notification Title'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{form.body || 'Notification message…'}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSend} disabled={sending}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm transition-colors flex items-center justify-center gap-2">
          {sending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Sending…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send Notification
            </>
          )}
        </button>

        {result && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600 flex-shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-sm text-emerald-700">
              Sent to <strong>{result.sent_count || 0}</strong> devices.
              {result.failed_count > 0 && <span className="text-amber-600 ml-1">({result.failed_count} failed)</span>}
            </p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Broadcast History</p>
          <button onClick={fetchHistory} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Refresh</button>
        </div>
        {loadingHistory ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-200">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <p className="text-sm">No broadcasts sent yet</p>
              </div>
            )}
            {history.map((b, i) => (
              <div key={b.id || i} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{b.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{b.body}</p>
                  {b.filters && Object.keys(b.filters).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {Object.entries(b.filters).map(([k, v]) => (
                        <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{k}: {v}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">{b.sent_count || 0} sent</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

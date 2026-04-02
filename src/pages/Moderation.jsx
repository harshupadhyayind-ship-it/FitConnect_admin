import { useEffect, useState } from 'react';
import api from '../config/api';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  resolved:  'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

export default function Moderation() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [resolveAction, setResolveAction] = useState('none');
  const [notes, setNotes] = useState('');
  const [actioning, setActioning] = useState(false);
  const limit = 20;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/moderation/reports?status=${status}&page=${page}&limit=${limit}`);
      setReports(res.data.reports || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [status, page]);

  const handleResolve = async () => {
    if (!selected) return;
    setActioning(true);
    try {
      await api.patch(`/admin/moderation/reports/${selected.id}/resolve`, { action: resolveAction, notes });
      setSelected(null);
      fetchReports();
    } catch (err) { alert(err.response?.data?.error || err.message); }
    finally { setActioning(false); }
  };

  const handleDismiss = async (reportId) => {
    if (!confirm('Dismiss this report?')) return;
    try { await api.patch(`/admin/moderation/reports/${reportId}/dismiss`); fetchReports(); }
    catch (err) { alert(err.response?.data?.error || err.message); }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Moderation</h1>
        <p className="text-gray-500 text-sm mt-1">{total} reports</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'resolved', 'dismissed'].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              status === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
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
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Report Details</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                      <p className="text-4xl mb-2">🛡️</p>
                      <p className="text-sm">No {status} reports</p>
                    </td></tr>
                  )}
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{r.reason || 'No reason given'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">By: <span className="font-mono">{r.reporter_id?.slice(0, 14)}...</span></p>
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-600">{r.report_type || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">
                        {r.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => { setSelected(r); setResolveAction('none'); setNotes(''); }} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium transition-colors">Resolve</button>
                            <button onClick={() => handleDismiss(r.id)} className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium transition-colors">Dismiss</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > limit && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  <button onClick={() => setPage(p => p+1)} disabled={page*limit>=total} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {reports.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                <p className="text-3xl mb-2">🛡️</p>
                <p className="text-sm">No {status} reports</p>
              </div>
            )}
            {reports.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm flex-1">{r.reason || 'No reason given'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="capitalize">{r.report_type || '—'}</span>
                  <span>·</span>
                  <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setSelected(r); setResolveAction('none'); setNotes(''); }} className="flex-1 text-center text-xs bg-green-50 text-green-700 py-1.5 rounded-lg hover:bg-green-100 font-medium">Resolve</button>
                    <button onClick={() => handleDismiss(r.id)} className="flex-1 text-center text-xs bg-gray-50 text-gray-500 py-1.5 rounded-lg hover:bg-gray-100 font-medium">Dismiss</button>
                  </div>
                )}
              </div>
            ))}
            {total > limit && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-500">{total} total</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 bg-white">← Prev</button>
                  <span className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg">{page}</span>
                  <button onClick={() => setPage(p => p+1)} disabled={page*limit>=total} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 bg-white">Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Resolve Report</h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{selected.reason}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'none',           label: '👍 No Action' },
                    { value: 'warn',           label: '⚠️ Warn User' },
                    { value: 'ban',            label: '🚫 Ban User' },
                    { value: 'delete_content', label: '🗑 Delete Content' },
                  ].map(a => (
                    <button key={a.value} onClick={() => setResolveAction(a.value)} className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${resolveAction === a.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional notes..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={handleResolve} disabled={actioning} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {actioning ? 'Resolving...' : 'Confirm'}
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

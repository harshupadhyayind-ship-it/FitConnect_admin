import { useEffect, useState } from 'react';
import api from '../config/api';
import { useDialog } from '../components/Dialog';

const statusStyle = {
  pending:   'bg-amber-50 text-amber-600 border-amber-100',
  resolved:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  dismissed: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function Moderation() {
  const { showAlert, showConfirm } = useDialog();
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
    } catch (err) { showAlert(err.response?.data?.error || err.message, { title: 'Action Failed', variant: 'error' }); }
    finally { setActioning(false); }
  };

  const handleDismiss = async (reportId) => {
    const ok = await showConfirm('Mark this report as dismissed? No action will be taken against the reported user.', {
      title: 'Dismiss Report',
      variant: 'warning',
      confirmText: 'Dismiss',
    });
    if (!ok) return;
    try { await api.patch(`/admin/moderation/reports/${reportId}/dismiss`); fetchReports(); }
    catch (err) { showAlert(err.response?.data?.error || err.message, { title: 'Dismiss Failed', variant: 'error' }); }
  };

  const tabs = ['pending', 'resolved', 'dismissed'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Moderation</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              status === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Report</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3.5"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-200">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <p className="text-sm text-gray-400">No {status} reports</p>
                    </div>
                  </td></tr>
                )}
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{r.reason || 'No reason given'}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">By {r.reporter_id?.slice(0, 14)}…</p>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-500 text-sm">{r.report_type || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyle[r.status] || statusStyle.dismissed}`}>{r.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-6 py-4">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => { setSelected(r); setResolveAction('none'); setNotes(''); }}
                            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
                            Resolve
                          </button>
                          <button onClick={() => handleDismiss(r.id)}
                            className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium transition-colors">
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > limit && (
              <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <p className="text-xs text-gray-400">Page {page} of {Math.ceil(total / limit)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-500"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={() => setPage(p => p+1)} disabled={page*limit>=total}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-500"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {reports.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">No {status} reports</div>
            )}
            {reports.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm flex-1">{r.reason || 'No reason given'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border flex-shrink-0 ${statusStyle[r.status] || statusStyle.dismissed}`}>{r.status}</span>
                </div>
                <p className="text-xs text-gray-400">{r.report_type || '—'} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</p>
                {r.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setSelected(r); setResolveAction('none'); setNotes(''); }}
                      className="flex-1 text-xs bg-emerald-50 text-emerald-700 py-1.5 rounded-lg font-medium">Resolve</button>
                    <button onClick={() => handleDismiss(r.id)}
                      className="flex-1 text-xs bg-gray-50 text-gray-500 py-1.5 rounded-lg font-medium">Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Resolve Report</h2>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{selected.reason}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Action</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'none',           label: 'No Action',      icon: 'M5 13l4 4L19 7' },
                    { value: 'warn',           label: 'Warn User',      icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
                    { value: 'ban',            label: 'Ban User',       icon: 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636' },
                    { value: 'delete_content', label: 'Delete Content', icon: 'M3 6h18M19 6l-1 14H6L5 6M8 6V4h8v2' },
                  ].map(a => (
                    <button key={a.value} onClick={() => setResolveAction(a.value)}
                      className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                        resolveAction === a.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                        <path d={a.icon}/>
                      </svg>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Optional notes..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"/>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={handleResolve} disabled={actioning}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm transition-colors">
                {actioning ? 'Resolving…' : 'Confirm'}
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

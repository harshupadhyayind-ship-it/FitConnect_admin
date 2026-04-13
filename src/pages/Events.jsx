import { useEffect, useRef, useState } from 'react';
import api from '../config/api';
import { useDialog } from '../components/Dialog';
import CityPicker from '../components/CityPicker';

const empty = { title: '', description: '', start_date: '', end_date: '', location: '', cover_image_url: '' };

export default function Events() {
  const { showAlert, showConfirm } = useDialog();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile]       = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [uploading, setUploading]       = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef();
  const limit = 20;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.set('status', status);
      const res = await api.get(`/admin/events?${params}`);
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [page, status]);

  const resetCover = () => {
    setCoverFile(null);
    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) return showAlert('Only JPG, PNG, WebP or GIF images are allowed.', { title: 'Invalid File Type', variant: 'warning' });
    if (file.size > 10 * 1024 * 1024) return showAlert('The image must be under 10 MB.', { title: 'File Too Large', variant: 'warning' });
    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const openCreate = () => {
    setForm(empty); setEditingEvent(null);
    resetCover();
    setShowForm(true);
  };
  const openEdit = (e) => {
    setForm({
      title: e.title || '', description: e.description || '',
      start_date: e.start_date?.slice(0, 16) || '', end_date: e.end_date?.slice(0, 16) || '',
      location: e.location || '', cover_image_url: e.cover_image_url || '',
    });
    setEditingEvent(e);
    resetCover();
    if (e.cover_image_url) setCoverPreview(e.cover_image_url);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.start_date || !form.end_date) return showAlert('Title, start date and end date are required.', { title: 'Required Fields', variant: 'warning' });
    setSaving(true);
    try {
      let cover_image_url = form.cover_image_url;

      // Upload new file if one was selected
      if (coverFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', coverFile);
        const res = await api.post('/admin/events/upload-cover', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        cover_image_url = res.data.url;
        setUploading(false);
      }

      const payload = { ...form, cover_image_url };
      editingEvent
        ? await api.patch(`/admin/events/${editingEvent.id}`, payload)
        : await api.post('/admin/events', payload);

      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setUploading(false);
      showAlert(err.response?.data?.error || err.message, { title: 'Save Failed', variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm('Delete this event? This cannot be undone.', {
      title: 'Delete Event',
      variant: 'danger',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try { await api.delete(`/admin/events/${id}`); fetchEvents(); }
    catch (err) { showAlert(err.response?.data?.error || err.message, { title: 'Delete Failed', variant: 'error' }); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} events total</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Event
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ value: '', label: 'All' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }].map(s => (
          <button key={s.value} onClick={() => { setStatus(s.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              status === s.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.length === 0 && (
              <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-200">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-sm">No events found. Create your first event!</p>
              </div>
            )}
            {events.map(e => {
              const isPast = new Date(e.end_date) < new Date();
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  {e.cover_image_url ? (
                    <img src={e.cover_image_url} className="w-full h-36 object-cover" alt="" onError={ev => ev.target.style.display='none'}/>
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-indigo-300">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{e.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${
                        isPast ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {isPast ? 'Past' : 'Upcoming'}
                      </span>
                    </div>
                    {e.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-1">{e.description}</p>}
                    <div className="text-xs text-gray-400 space-y-1 mt-auto">
                      <p className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {new Date(e.start_date).toLocaleDateString()} → {new Date(e.end_date).toLocaleDateString()}
                      </p>
                      {e.location && (
                        <p className="flex items-center gap-1.5">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {e.location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(e)}
                        className="flex-1 text-xs bg-indigo-50 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(e.id)}
                        className="flex-1 text-xs bg-rose-50 text-rose-600 py-1.5 rounded-lg hover:bg-rose-100 font-medium transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Page {page} of {Math.ceil(total / limit)}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white bg-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-500"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button onClick={() => setPage(p => p+1)} disabled={page*limit>=total}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white bg-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-500"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description" rows={3} style={{resize:'vertical'}}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
              </div>

              {/* Cover image upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cover Image</label>

                {coverPreview ? (
                  /* Preview with change/remove controls */
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-44 object-cover"/>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg font-medium shadow hover:bg-gray-50 transition-colors">
                        Change
                      </button>
                      <button type="button" onClick={resetCover}
                        className="bg-rose-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow hover:bg-rose-700 transition-colors">
                        Remove
                      </button>
                    </div>
                    {/* File name badge */}
                    {coverFile && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
                        <p className="text-white text-[11px] truncate">{coverFile.name}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Drop zone */
                  <div
                    className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                      dragOver ? 'border-indigo-400 bg-indigo-50/60' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); applyFile(e.dataTransfer.files[0]); }}
                  >
                    <div className="flex flex-col items-center gap-2 py-8 px-4 pointer-events-none select-none">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-500 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          <span className="text-indigo-600">Click to upload</span> or drag & drop
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP or GIF · Max 10 MB</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => applyFile(e.target.files?.[0])}
                />
              </div>
              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
                <CityPicker
                  value={form.location}
                  onChange={location => setForm(p => ({ ...p, location }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'start_date', label: 'Start Date *' }, { key: 'end_date', label: 'End Date *' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                    <input type="datetime-local" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm transition-colors flex items-center justify-center gap-2">
                {(saving || uploading) && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                )}
                {uploading ? 'Uploading image…' : saving ? 'Saving…' : editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
              <button onClick={() => setShowForm(false)}
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

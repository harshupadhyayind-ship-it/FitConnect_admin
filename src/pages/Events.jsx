import { useEffect, useState } from 'react';
import api from '../config/api';

const empty = { title: '', description: '', start_date: '', end_date: '', location: '', cover_image_url: '' };

export default function Events() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
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

  const openCreate = () => {
    setForm(empty);
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEdit = (e) => {
    setForm({
      title: e.title || '',
      description: e.description || '',
      start_date: e.start_date?.slice(0, 16) || '',
      end_date: e.end_date?.slice(0, 16) || '',
      location: e.location || '',
      cover_image_url: e.cover_image_url || '',
    });
    setEditingEvent(e);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.start_date || !form.end_date) return alert('Title, start date and end date are required');
    setSaving(true);
    try {
      if (editingEvent) {
        await api.patch(`/admin/events/${editingEvent.id}`, form);
      } else {
        await api.post('/admin/events', form);
      }
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 text-sm mt-1">{total} events total</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Create
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => { setStatus(s.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {events.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-sm">No events found. Create your first event!</p>
            </div>
          )}
          {events.map(e => {
            const isPast = new Date(e.end_date) < new Date();
            return (
              <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {e.cover_image_url ? (
                  <img src={e.cover_image_url} className="w-full h-36 object-cover" alt="" onError={ev => ev.target.style.display = 'none'} />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl">
                    🏆
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{e.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                      isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {isPast ? 'Past' : 'Upcoming'}
                    </span>
                  </div>
                  {e.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{e.description}</p>
                  )}
                  <div className="text-xs text-gray-400 space-y-1 mt-auto">
                    <p>📅 {new Date(e.start_date).toLocaleDateString()} → {new Date(e.end_date).toLocaleDateString()}</p>
                    {e.location && <p>📍 {e.location}</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEdit(e)}
                      className="flex-1 text-center text-xs bg-indigo-50 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="flex-1 text-center text-xs bg-red-50 text-red-600 py-1.5 rounded-lg hover:bg-red-100 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">Select a city</option>
                  <optgroup label="Online">
                    <option value="Online">🌐 Online / Virtual</option>
                  </optgroup>
                  <optgroup label="Metro Cities">
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Pune">Pune</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </optgroup>
                  <optgroup label="Tier 2 Cities">
                    <option value="Jaipur">Jaipur</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Surat">Surat</option>
                    <option value="Kanpur">Kanpur</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Indore">Indore</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Patna">Patna</option>
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Agra">Agra</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Meerut">Meerut</option>
                    <option value="Varanasi">Varanasi</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Visakhapatnam">Visakhapatnam</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Guwahati">Guwahati</option>
                    <option value="Kochi">Kochi</option>
                  </optgroup>
                </select>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

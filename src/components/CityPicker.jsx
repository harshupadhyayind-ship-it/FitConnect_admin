import { useEffect, useRef, useState } from 'react';

const CITY_GROUPS = [
  {
    label: 'Online',
    cities: ['Online / Virtual'],
  },
  {
    label: 'Metro Cities',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
  },
  {
    label: 'Tier 2 Cities',
    cities: [
      'Jaipur', 'Lucknow', 'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna',
      'Ludhiana', 'Agra', 'Vadodara', 'Nashik', 'Rajkot', 'Meerut', 'Varanasi',
      'Coimbatore', 'Visakhapatnam', 'Chandigarh', 'Guwahati', 'Kochi',
    ],
  },
];

export default function CityPicker({ value, onChange, placeholder = 'Select a city' }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const containerRef          = useRef(null);
  const searchRef             = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const query = search.trim().toLowerCase();

  const filteredGroups = CITY_GROUPS.map(group => ({
    ...group,
    cities: group.cities.filter(c => c.toLowerCase().includes(query)),
  })).filter(group => group.cities.length > 0);

  const handleSelect = (city) => {
    onChange(city);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2 text-sm transition-all bg-white
          ${open ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Location pin icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round"
            className={`w-4 h-4 flex-shrink-0 ${value ? 'text-indigo-500' : 'text-gray-300'}`}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className={`truncate ${value ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
            {value || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Clear button */}
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>
          )}
          {/* Chevron */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-[110] mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          style={{ animation: 'fadeUp 120ms ease-out' }}>

          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                strokeLinecap="round" strokeLinejoin="round"
                className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50"
              />
            </div>
          </div>

          {/* City list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">No cities match "{search}"</div>
            ) : (
              filteredGroups.map(group => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-white border-b border-gray-50">
                    {group.label}
                  </div>
                  {group.cities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelect(city)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                        ${value === city
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {/* Check mark for selected */}
                      <span className={`w-4 h-4 flex items-center justify-center flex-shrink-0 ${value === city ? 'text-indigo-600' : 'text-transparent'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                          strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      {city}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

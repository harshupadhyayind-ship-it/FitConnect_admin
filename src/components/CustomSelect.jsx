import { useEffect, useRef, useState } from 'react';

/**
 * CustomSelect — drop-in replacement for <select>
 *
 * Props:
 *   value      — current value (string)
 *   onChange   — (value: string) => void
 *   options    — [{ value, label }]  or  [{ group, items: [{value, label}] }]
 *   placeholder — shown when value is empty
 *   className  — extra classes on the trigger button
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select…', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Flatten options to find selected label
  const flat = options.flatMap(o => o.group ? o.items : [o]);
  const selectedLabel = flat.find(o => o.value === value)?.label ?? '';

  const handleSelect = (val) => { onChange(val); setOpen(false); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-xl bg-white transition-all
          ${open
            ? 'border-indigo-400 ring-2 ring-indigo-100'
            : 'border-gray-200 hover:border-gray-300'
          } ${!value ? 'text-gray-400' : 'text-gray-800 font-medium'}`}
      >
        <span className="truncate">{value ? selectedLabel : placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-[110] mt-1.5 w-full min-w-[140px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ animation: 'fadeUp 120ms ease-out' }}
        >
          <div className="py-1">
            {options.map((o, i) =>
              o.group ? (
                /* Grouped options */
                <div key={o.group}>
                  {i > 0 && <div className="border-t border-gray-100 my-1"/>}
                  <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {o.group}
                  </div>
                  {o.items.map(item => (
                    <OptionRow key={item.value} item={item} selected={value === item.value} onSelect={handleSelect}/>
                  ))}
                </div>
              ) : (
                /* Flat options */
                <OptionRow key={o.value} item={o} selected={value === o.value} onSelect={handleSelect}/>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.value)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
        ${selected
          ? 'bg-indigo-50 text-indigo-700 font-medium'
          : 'text-gray-700 hover:bg-gray-50'}`}
    >
      {/* Checkmark placeholder keeps alignment */}
      <span className={`flex-shrink-0 ${selected ? 'text-indigo-600' : 'text-transparent'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
      {item.label}
    </button>
  );
}

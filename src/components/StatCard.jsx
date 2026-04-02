export default function StatCard({ title, value, subtitle, icon, color = 'indigo', onClick }) {
  const colors = {
    indigo: 'bg-indigo-500',
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    red:    'bg-red-500',
    purple: 'bg-purple-500',
    blue:   'bg-blue-500',
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 lg:p-5 flex items-center gap-3 text-left w-full transition-all duration-150 ${
        onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-95' : ''
      }`}
    >
      <div className={`${colors[color]} text-white text-lg lg:text-2xl w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium leading-tight truncate">{title}</p>
        <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      {onClick && (
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </Tag>
  );
}

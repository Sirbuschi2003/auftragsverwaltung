import { RequestStatus } from '../api/client';

const CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  DRAFT:            { label: 'Entwurf',              className: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 ring-gray-200 dark:ring-slate-600' },
  SUBMITTED:        { label: 'Eingereicht (alt)',     className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-600' },
  PENDING_APPROVAL: { label: 'Wartet auf Freigabe',  className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-800' },
  TECHNICAL_CHECK:  { label: 'Technische Prüfung',   className: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 ring-indigo-200 dark:ring-indigo-800' },
  IN_WAREHOUSE:     { label: 'Im Lager',             className: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-800' },
  UNPACKING:        { label: 'Auspacken',            className: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 ring-orange-200 dark:ring-orange-800' },
  CONFIGURING:      { label: 'Konfiguration',        className: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 ring-purple-200 dark:ring-purple-800' },
  DELIVERY_NOTE:    { label: 'Lieferschein',         className: 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 ring-pink-200 dark:ring-pink-800' },
  SCHEDULING:       { label: 'Terminplanung',        className: 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 ring-teal-200 dark:ring-teal-800' },
  DONE:             { label: 'Fertig',               className: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-800' },
  ARCHIVED:         { label: 'Archiviert',           className: 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 ring-gray-200 dark:ring-slate-700' },
};

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(CONFIG).map(([k, v]) => [k, v.label])
) as Record<RequestStatus, string>;

interface Props {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG['DRAFT'];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center font-medium rounded-full ring-1 ${cfg.className} ${sizeClass}`}>
      {cfg.label}
    </span>
  );
}

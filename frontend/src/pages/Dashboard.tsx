import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { api, MachineRequest, RequestStatus } from '../api/client';
import { StatusBadge, STATUS_LABELS } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

const ALL_STATUSES: RequestStatus[] = ['DRAFT', 'SUBMITTED', 'IN_WAREHOUSE', 'UNPACKING', 'CONFIGURING', 'DONE'];

const STATUS_COLORS: Record<RequestStatus, string> = {
  DRAFT: 'border-t-gray-400',
  SUBMITTED: 'border-t-blue-500',
  IN_WAREHOUSE: 'border-t-yellow-500',
  UNPACKING: 'border-t-orange-500',
  CONFIGURING: 'border-t-purple-500',
  DONE: 'border-t-green-500',
};

const SUMMARY_BG: Record<RequestStatus, string> = {
  DRAFT: 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700',
  SUBMITTED: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  IN_WAREHOUSE: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
  UNPACKING: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900',
  CONFIGURING: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
  DONE: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
};

const SUMMARY_TEXT: Record<RequestStatus, string> = {
  DRAFT: 'text-gray-700 dark:text-slate-300',
  SUBMITTED: 'text-blue-700 dark:text-blue-400',
  IN_WAREHOUSE: 'text-yellow-700 dark:text-yellow-400',
  UNPACKING: 'text-orange-700 dark:text-orange-400',
  CONFIGURING: 'text-purple-700 dark:text-purple-400',
  DONE: 'text-green-700 dark:text-green-400',
};

function RequestCard({ request, onClick }: { request: MachineRequest; onClick: () => void }) {
  const date = new Date(request.updatedAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/50 hover:border-brand-200 dark:hover:border-brand-500/40 transition-all duration-200 p-4 group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-600/15 px-2 py-0.5 rounded-md">
          {request.requestNumber}
        </span>
        <StatusBadge status={request.status} size="sm" />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-0.5 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
        {request.customer.companyName}
      </p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{request.machineModel.modelName}</p>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
        <span>{request.customerSite.city}</span>
        <span>{date}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-50 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
        {request.salesRep.name}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MachineRequest[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [reqs, sum] = await Promise.all([api.machineRequests.getAll(), api.statistics.summary()]);
      setRequests(reqs);
      setSummary(sum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleStatuses = ALL_STATUSES.filter((s) => {
    if (!user) return false;
    const roleMap: Record<string, RequestStatus[]> = {
      SALES: ['DRAFT', 'SUBMITTED'],
      MANAGEMENT: ['SUBMITTED', 'IN_WAREHOUSE', 'DONE'],
      WAREHOUSE: ['IN_WAREHOUSE', 'UNPACKING'],
      TECHNICIAN: ['UNPACKING', 'CONFIGURING', 'DONE'],
      ADMIN: ALL_STATUSES,
    };
    return (roleMap[user.role] || ALL_STATUSES).includes(s);
  });

  const byStatus = (status: RequestStatus) => requests.filter((r) => r.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Übersicht</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Alle Maschinenanfragen im Überblick</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_STATUSES.map((status) => (
          <div key={status} className={`rounded-xl border p-4 transition-colors ${SUMMARY_BG[status]}`}>
            <p className={`text-2xl font-bold ${SUMMARY_TEXT[status]}`}>{summary[status] ?? 0}</p>
            <p className={`text-xs mt-0.5 font-medium ${SUMMARY_TEXT[status]} opacity-80`}>
              {STATUS_LABELS[status]}
            </p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {visibleStatuses.map((status) => {
            const cards = byStatus(status);
            return (
              <div key={status} className="w-72 flex-shrink-0">
                <div className={`bg-white dark:bg-slate-800/80 rounded-xl border-t-4 border border-gray-100 dark:border-slate-700 shadow-sm ${STATUS_COLORS[status]}`}>
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center">
                      {cards.length}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {cards.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Keine Anfragen</p>
                    ) : (
                      cards.map((req) => (
                        <RequestCard
                          key={req.id}
                          request={req}
                          onClick={() => navigate(`/requests/${req.id}`)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

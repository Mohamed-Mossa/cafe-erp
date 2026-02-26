import { baseApi } from '../../../app/baseApi';
import { CafeTable, ApiResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/currency';

const floorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTables: b.query<ApiResponse<CafeTable[]>, void>({
      query: () => '/floor/tables', providesTags: ['Order'],
    }),
  }), overrideExisting: false,
});
const { useGetTablesQuery } = floorApi;

const STATUS_STYLE: Record<string, string> = {
  FREE: 'bg-green-50 border-green-300 text-green-700',
  OCCUPIED: 'bg-blue-50 border-blue-400 text-blue-800',
  BILLING: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  RESERVED: 'bg-purple-50 border-purple-300 text-purple-700',
};

export default function FloorPage() {
  const { data, isLoading } = useGetTablesQuery(undefined, { pollingInterval: 10000 });
  const tables = data?.data || [];
  const counts = tables.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">🪑 Floor Plan</h1>
        <div className="flex gap-2 text-sm">
          {Object.entries({ FREE: '🟢', OCCUPIED: '🔵', BILLING: '🟡', RESERVED: '🟣' }).map(([s, e]) => (
            <span key={s} className="px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-600">
              {e} {s} ({counts[s] || 0})
            </span>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading tables...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {tables.map(table => (
            <div key={table.id} className={`rounded-2xl border-2 p-4 cursor-pointer transition hover:shadow-md ${STATUS_STYLE[table.status] || 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold text-lg">{table.name}</div>
              <div className="text-xs mt-1 opacity-70">👥 {table.capacity} seats</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wide">{table.status}</div>
              {table.currentAmount && (
                <div className="mt-1 text-sm font-bold">{formatCurrency(table.currentAmount)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

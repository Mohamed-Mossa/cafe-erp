import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const reportsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboard: b.query<any, void>({ query: () => '/reports/dashboard' }),
    getSalesReport: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/sales?from=${from}&to=${to}`,
    }),
  }), overrideExisting: false,
});
const { useGetDashboardQuery, useGetSalesReportQuery } = reportsApi;

const today = new Date().toISOString().split('T')[0];
const todayStart = `${today}T00:00:00`;
const todayEnd = `${today}T23:59:59`;

export default function ReportsPage() {
  const { data: dashRes } = useGetDashboardQuery(undefined, { pollingInterval: 30000 });
  const [from, setFrom] = useState(todayStart);
  const [to, setTo] = useState(todayEnd);
  const [query, setQuery] = useState({ from: todayStart, to: todayEnd });
  const { data: salesRes } = useGetSalesReportQuery(query);

  const dash = dashRes?.data;
  const sales = salesRes?.data;

  return (
    <div className="h-full space-y-4">
      <h1 className="text-xl font-bold text-slate-800">📊 Reports</h1>

      {/* KPI Cards */}
      {dash && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Today's Sales", value: formatCurrency(dash.todaySales), icon: '💰', color: 'bg-green-50 text-green-700' },
            { label: 'Orders Today', value: dash.todayOrderCount, icon: '🧾', color: 'bg-blue-50 text-blue-700' },
            { label: 'Open Orders', value: dash.openOrders, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Active Sessions', value: dash.activeSessions, icon: '🎮', color: 'bg-purple-50 text-purple-700' },
            { label: 'Low Stock Alerts', value: dash.lowStockAlerts, icon: '⚠️', color: 'bg-red-50 text-red-700' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`rounded-2xl p-4 ${color}`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm opacity-75">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sales Report */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-slate-800 mb-4">Sales Report</h2>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">From</label>
            <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">To</label>
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none" />
          </div>
          <div className="self-end">
            <button onClick={() => setQuery({ from, to })} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl">Run</button>
          </div>
        </div>
        {sales && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-xs text-green-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(sales.totalRevenue)}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-xs text-blue-500 mb-1">Order Count</div>
                <div className="text-2xl font-bold text-blue-700">{sales.orderCount}</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-xs text-orange-500 mb-1">Total Discounts</div>
                <div className="text-2xl font-bold text-orange-700">{formatCurrency(sales.totalDiscount)}</div>
              </div>
            </div>
            {sales.revenueBySource && (
              <div>
                <div className="text-sm font-medium text-slate-600 mb-2">Revenue by Source</div>
                <div className="space-y-2">
                  {Object.entries(sales.revenueBySource).map(([src, amount]) => (
                    <div key={src} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-sm">
                      <span className="text-slate-700 font-medium">{src}</span>
                      <span className="font-bold text-slate-800">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

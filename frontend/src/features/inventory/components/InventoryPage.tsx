import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const inventoryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getInventory: b.query<any, void>({ query: () => '/inventory', providesTags: ['Inventory'] }),
    getAlerts: b.query<any, void>({ query: () => '/inventory/alerts', providesTags: ['Inventory'] }),
    addPurchase: b.mutation<any, any>({ query: (body) => ({ url: '/inventory/purchases', method: 'POST', body }), invalidatesTags: ['Inventory'] }),
    recordWastage: b.mutation<any, any>({ query: (body) => ({ url: '/inventory/wastage', method: 'POST', body }), invalidatesTags: ['Inventory'] }),
  }), overrideExisting: false,
});
const { useGetInventoryQuery, useGetAlertsQuery, useAddPurchaseMutation, useRecordWastageMutation } = inventoryApi;

export default function InventoryPage() {
  const { data: invRes } = useGetInventoryQuery();
  const { data: alertsRes } = useGetAlertsQuery();
  const [addPurchase] = useAddPurchaseMutation();
  const [recordWastage] = useRecordWastageMutation();
  const [tab, setTab] = useState<'all' | 'alerts' | 'purchase' | 'wastage'>('all');
  const [form, setForm] = useState<any>({});

  const items = invRes?.data || [];
  const alerts = alertsRes?.data || [];

  const stockColor = (item: any) => {
    if (item.currentStock <= 0) return 'text-red-600 bg-red-50';
    if (item.currentStock <= item.reorderLevel) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">📦 Inventory</h1>
        {alerts.length > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
            ⚠️ {alerts.length} Low Stock Alert{alerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        {(['all', 'alerts', 'purchase', 'wastage'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {t === 'alerts' && alerts.length > 0 ? `⚠️ Alerts (${alerts.length})` : t}
          </button>
        ))}
      </div>

      {(tab === 'all' || tab === 'alerts') && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                {['Item', 'Unit', 'Stock', 'Reorder Level', 'Avg Cost'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tab === 'all' ? items : alerts).map((item: any) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-sm font-bold ${stockColor(item)}`}>
                      {parseFloat(item.currentStock).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.reorderLevel}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(item.averageCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'purchase' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 max-w-md">
          <h3 className="font-bold mb-4">Record Purchase</h3>
          <div className="space-y-3">
            <select onChange={e => setForm({ ...form, inventoryItemId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
              <option value="">Select Item</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            {['quantity', 'unitCost', 'supplierName', 'invoiceNumber'].map(field => (
              <input key={field} type={field === 'quantity' || field === 'unitCost' ? 'number' : 'text'}
                placeholder={field.replace(/([A-Z])/g, ' $1')}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            ))}
            <button onClick={() => addPurchase(form)}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
              Add Purchase
            </button>
          </div>
        </div>
      )}

      {tab === 'wastage' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 max-w-md">
          <h3 className="font-bold mb-4">Record Wastage</h3>
          <div className="space-y-3">
            <select onChange={e => setForm({ ...form, inventoryItemId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
              <option value="">Select Item</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input type="number" placeholder="Quantity"
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
            <input type="text" placeholder="Reason"
              onChange={e => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
            <button onClick={() => recordWastage(form)}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl">
              Record Wastage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const promoApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPromos: b.query<any, void>({ query: () => '/promos', providesTags: ['Promo'] }),
    createPromo: b.mutation<any, any>({ query: (body) => ({ url: '/promos', method: 'POST', body }), invalidatesTags: ['Promo'] }),
  }), overrideExisting: false,
});
const { useGetPromosQuery, useCreatePromoMutation } = promoApi;

const today = new Date().toISOString().split('T')[0];

export default function PromotionsPage() {
  const { data: promosRes } = useGetPromosQuery();
  const [createPromo] = useCreatePromoMutation();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'PERCENT', discountValue: '', maxUsageCount: '1', startDate: today, endDate: today });
  const promos = promosRes?.data || [];

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">🎟️ Promo Codes</h1>
        <button onClick={() => setShow(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl text-sm">+ New Promo</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {promos.map((p: any) => (
          <div key={p.id} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${p.active ? 'border-green-400' : 'border-slate-300'}`}>
            <div className="flex justify-between items-start mb-2">
              <code className="text-lg font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">{p.code}</code>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {p.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-2">{p.description}</p>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="bg-slate-50 px-2 py-1 rounded">
                {p.discountType === 'PERCENT' ? `${p.discountValue}%` : formatCurrency(p.discountValue)} off
              </span>
              <span className="bg-slate-50 px-2 py-1 rounded">{p.currentUsageCount}/{p.maxUsageCount} used</span>
              <span className="bg-slate-50 px-2 py-1 rounded">Until {p.endDate}</span>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Create Promo Code</h2>
            <div className="space-y-3">
              <input placeholder="Code (e.g. SUMMER20)" value={form.code} onChange={e => f('code', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono uppercase" />
              <input placeholder="Description" value={form.description} onChange={e => f('description', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.discountType} onChange={e => f('discountType', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
                <input type="number" placeholder="Value" value={form.discountValue} onChange={e => f('discountValue', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              </div>
              <input type="number" placeholder="Max Usage Count" value={form.maxUsageCount} onChange={e => f('maxUsageCount', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm mt-1" /></div>
                <div><label className="text-xs text-slate-500">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm mt-1" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShow(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600">Cancel</button>
              <button onClick={async () => { await createPromo({ ...form, discountValue: parseFloat(form.discountValue), maxUsageCount: parseInt(form.maxUsageCount) }); setShow(false); }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

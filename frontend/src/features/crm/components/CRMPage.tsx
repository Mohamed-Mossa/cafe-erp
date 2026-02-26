import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    lookupCustomer: b.query<any, string>({ query: (phone) => `/customers/lookup?phone=${phone}` }),
    createCustomer: b.mutation<any, any>({ query: (body) => ({ url: '/customers', method: 'POST', body }) }),
    getPointHistory: b.query<any, string>({ query: (id) => `/customers/${id}/points` }),
    redeemPoints: b.mutation<any, any>({ query: ({ id, ...body }) => ({ url: `/customers/${id}/redeem`, method: 'POST', body }) }),
  }), overrideExisting: false,
});
const { useLookupCustomerQuery, useCreateCustomerMutation, useGetPointHistoryQuery, useRedeemPointsMutation } = crmApi;

const TIER_STYLE: Record<string, string> = {
  BRONZE: 'bg-orange-50 text-orange-700 border-orange-200',
  SILVER: 'bg-slate-50 text-slate-700 border-slate-200',
  GOLD: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function CRMPage() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ phone: '', fullName: '', email: '' });
  const [createCustomer] = useCreateCustomerMutation();

  const { data: customerRes, isError } = useLookupCustomerQuery(searchPhone, { skip: !searchPhone });
  const customer = customerRes?.data;
  const { data: historyRes } = useGetPointHistoryQuery(customer?.id, { skip: !customer?.id });
  const history = historyRes?.data || [];

  return (
    <div className="h-full flex gap-4">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-slate-800 mb-4">👥 Customers</h1>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex gap-2">
            <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearchPhone(phone)}
              placeholder="Search by phone number..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => setSearchPhone(phone)} className="px-5 py-3 bg-blue-600 text-white font-medium rounded-xl">Search</button>
            <button onClick={() => setShowCreate(true)} className="px-5 py-3 bg-green-600 text-white font-medium rounded-xl">+ New</button>
          </div>
        </div>

        {/* Customer Card */}
        {customer && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-slate-800">{customer.fullName}</div>
                <div className="text-slate-500">{customer.phone}</div>
                {customer.email && <div className="text-slate-400 text-sm">{customer.email}</div>}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${TIER_STYLE[customer.tier]}`}>
                {customer.tier === 'GOLD' ? '⭐' : customer.tier === 'SILVER' ? '🥈' : '🥉'} {customer.tier}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-xs text-blue-500 mb-1">Points Balance</div>
                <div className="text-2xl font-bold text-blue-700">{customer.totalPoints}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-xs text-green-500 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(customer.totalSpent)}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-xs text-purple-500 mb-1">Credit Balance</div>
                <div className="text-2xl font-bold text-purple-700">{formatCurrency(customer.creditBalance)}</div>
              </div>
            </div>
          </div>
        )}

        {isError && searchPhone && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            No customer found for "{searchPhone}"
          </div>
        )}

        {/* Points History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold mb-3 text-slate-800">Points History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{tx.description}</span>
                    <div className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">New Customer</h2>
            <div className="space-y-3">
              {[
                { key: 'phone', label: 'Phone *', type: 'tel' },
                { key: 'fullName', label: 'Full Name *', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
              ].map(({ key, label, type }) => (
                <input key={key} type={type} placeholder={label}
                  value={(createForm as any)[key]}
                  onChange={e => setCreateForm({ ...createForm, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600">Cancel</button>
              <button onClick={async () => { await createCustomer(createForm); setShowCreate(false); }}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

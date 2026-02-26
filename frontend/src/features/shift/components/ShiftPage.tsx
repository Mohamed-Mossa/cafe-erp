import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const shiftApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCurrentShift: b.query<any, void>({ query: () => '/shifts/current', providesTags: ['Shift'] }),
    openShift: b.mutation<any, { openingBalance: number }>({
      query: (body) => ({ url: '/shifts/open', method: 'POST', body }), invalidatesTags: ['Shift'],
    }),
    closeShift: b.mutation<any, { shiftId: string; actualCash: number; closingNotes?: string }>({
      query: ({ shiftId, ...body }) => ({ url: `/shifts/${shiftId}/close`, method: 'POST', body }), invalidatesTags: ['Shift'],
    }),
    addExpense: b.mutation<any, { shiftId: string; description: string; amount: number; category?: string }>({
      query: ({ shiftId, ...body }) => ({ url: `/shifts/${shiftId}/expenses`, method: 'POST', body }), invalidatesTags: ['Shift'],
    }),
    getExpenses: b.query<any, string>({ query: (id) => `/shifts/${id}/expenses`, providesTags: ['Shift'] }),
  }), overrideExisting: false,
});
const { useGetCurrentShiftQuery, useOpenShiftMutation, useCloseShiftMutation, useAddExpenseMutation, useGetExpensesQuery } = shiftApi;

export default function ShiftPage() {
  const { data: shiftRes, isLoading } = useGetCurrentShiftQuery();
  const [openShift] = useOpenShiftMutation();
  const [closeShift] = useCloseShiftMutation();
  const [addExpense] = useAddExpenseMutation();
  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [showClose, setShowClose] = useState(false);

  const shift = shiftRes?.data;
  const { data: expensesRes } = useGetExpensesQuery(shift?.id, { skip: !shift?.id });
  const expenses = expensesRes?.data || [];

  const handleOpen = async () => {
    if (!openingBalance) return;
    await openShift({ openingBalance: parseFloat(openingBalance) });
    setOpeningBalance('');
  };

  const handleClose = async () => {
    if (!shift || !actualCash) return;
    await closeShift({ shiftId: shift.id, actualCash: parseFloat(actualCash), closingNotes });
    setShowClose(false);
  };

  const handleAddExpense = async () => {
    if (!shift || !expDesc || !expAmount) return;
    await addExpense({ shiftId: shift.id, description: expDesc, amount: parseFloat(expAmount), category: expCategory });
    setExpDesc(''); setExpAmount(''); setExpCategory('');
  };

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>;

  if (!shift) return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🕐</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Active Shift</h2>
        <p className="text-slate-500 text-sm mb-6">Enter opening cash to start your shift</p>
        <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)}
          placeholder="Opening balance (EGP)" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-bold mb-4 outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleOpen} disabled={!openingBalance}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition">
          ▶ Open Shift
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex gap-4">
      {/* Shift Summary */}
      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-lg text-slate-800">Active Shift</div>
              <div className="text-sm text-slate-500">{shift.cashierName} • Opened {new Date(shift.createdAt).toLocaleTimeString()}</div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">OPEN</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Opening', value: shift.openingBalance },
              { label: 'Total Sales', value: shift.totalSales },
              { label: 'Expenses', value: shift.totalExpenses },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="font-bold text-slate-800">{formatCurrency(value || 0)}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowClose(true)}
            className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition">
            🔒 Close Shift (Blind)
          </button>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3">Petty Expenses</h3>
          <div className="flex gap-2 mb-3">
            <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Description"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount" type="number"
              className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleAddExpense} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Add</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {expenses.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No expenses recorded</p>
              : expenses.map((e: any) => (
                <div key={e.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-sm">
                  <span className="text-slate-700">{e.description}</span>
                  <span className="font-bold text-red-600">−{formatCurrency(e.amount)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Blind Close Modal */}
      {showClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2">Close Shift</h2>
            <p className="text-sm text-slate-500 mb-5">Enter the actual cash you have counted — <strong>without seeing the expected amount</strong></p>
            <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)}
              placeholder="Actual cash count (EGP)" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-center text-2xl font-bold mb-3 outline-none focus:border-blue-500" autoFocus />
            <textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)}
              placeholder="Notes (optional)" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowClose(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600">Cancel</button>
              <button onClick={handleClose} disabled={!actualCash} className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-bold rounded-xl">
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Order, PaymentMethod } from '../../../../types/api.types';
import { useProcessPaymentMutation } from '../../api/ordersApi';
import { setCurrentOrder } from '../../store/posSlice';
import { formatCurrency } from '../../../../utils/currency';

const METHODS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: 'CASH', label: 'Cash', icon: '💵' },
  { method: 'CARD', label: 'Card', icon: '💳' },
  { method: 'EWALLET', label: 'E-Wallet', icon: '📱' },
  { method: 'CREDIT', label: 'Credit', icon: '📋' },
];

interface Props { order: Order; onClose: () => void; onSuccess: () => void; }

export default function PaymentModal({ order, onClose, onSuccess }: Props) {
  const dispatch = useDispatch();
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amountInput, setAmountInput] = useState(String(order.grandTotal));
  const [reference, setReference] = useState('');
  const [processPayment, { isLoading }] = useProcessPaymentMutation();

  const amount = parseFloat(amountInput) || 0;
  const change = amount - order.grandTotal;

  const handleConfirm = async () => {
    if (amount < order.grandTotal) return;
    try {
      const res = await processPayment({
        orderId: order.id,
        payments: [{ method, amount: order.grandTotal, reference: reference || undefined }],
      }).unwrap();
      dispatch(setCurrentOrder(res.data));
      onSuccess();
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Process Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount due */}
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500 mb-1">Amount Due</div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(order.grandTotal)}</div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map(({ method: m, label, icon }) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition text-xs font-medium
                    ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <span className="text-xl">{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {method === 'CASH' ? 'Amount Received' : 'Amount'}
            </label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
            />
          </div>

          {/* Reference (for card/ewallet) */}
          {(method === 'CARD' || method === 'EWALLET') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reference Number</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction reference..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          )}

          {/* Change */}
          {method === 'CASH' && change > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-sm text-green-600 mb-1">Change</div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(change)}</div>
            </div>
          )}

          {/* Error */}
          {amount < order.grandTotal && amount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-sm text-red-600">
              Amount is less than total ({formatCurrency(order.grandTotal - amount)} short)
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || amount < order.grandTotal}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold transition">
            {isLoading ? 'Processing...' : '✓ Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

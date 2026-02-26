import { useDispatch } from 'react-redux';
import { Order } from '../../../../types/api.types';
import { useRemoveLineMutation } from '../../api/ordersApi';
import { setCurrentOrder } from '../../store/posSlice';
import { formatCurrency } from '../../../../utils/currency';

interface Props { order: Order | null; onPay: () => void; onClearOrder: () => void; }

export default function OrderPanel({ order, onPay, onClearOrder }: Props) {
  const dispatch = useDispatch();
  const [removeLine] = useRemoveLineMutation();

  const handleRemoveLine = async (lineId: string) => {
    if (!order) return;
    try {
      const res = await removeLine({ orderId: order.id, lineId }).unwrap();
      dispatch(setCurrentOrder(res.data));
    } catch (err) {
      console.error('Failed to remove line', err);
    }
  };

  if (!order) {
    return (
      <div className="h-full bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center text-slate-400">
        <span className="text-6xl mb-4">🛒</span>
        <p className="text-sm">No active order</p>
        <p className="text-xs mt-1">Click a product to start</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <div className="font-bold text-slate-800">Order #{order.orderNumber}</div>
          <div className="text-xs text-slate-500">{order.source} {order.tableName && `• ${order.tableName}`}</div>
        </div>
        <button onClick={onClearOrder} className="text-red-400 hover:text-red-600 text-sm transition">Clear</button>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {order.lines.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No items yet</p>
        ) : (
          order.lines.map((line) => (
            <div key={line.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{line.productName}</div>
                {line.notes && <div className="text-xs text-slate-400 italic">{line.notes}</div>}
                <div className="text-xs text-slate-500 mt-1">× {line.quantity} @ {formatCurrency(line.unitPrice)}</div>
              </div>
              <div className="text-sm font-bold text-slate-800">{formatCurrency(line.totalPrice)}</div>
              <button
                onClick={() => handleRemoveLine(line.id)}
                className="text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount {order.promoCodeApplied && `(${order.promoCodeApplied})`}</span>
            <span>−{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-slate-900 text-lg pt-2 border-t border-slate-100">
          <span>Total</span>
          <span>{formatCurrency(order.grandTotal)}</span>
        </div>

        <button
          onClick={onPay}
          disabled={order.lines.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl text-lg transition mt-2"
        >
          💵 Pay {formatCurrency(order.grandTotal)}
        </button>
      </div>
    </div>
  );
}

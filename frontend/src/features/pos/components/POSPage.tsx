import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../app/store';
import { setCurrentOrder, clearCurrentOrder } from '../store/posSlice';
import { useGetOpenOrdersQuery, useCreateOrderMutation, useAddLineMutation, useProcessPaymentMutation } from '../api/ordersApi';
import { useSelector as useReduxSelector } from 'react-redux';
import { Order, Product } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/currency';
import ProductGrid from './ProductGrid/ProductGrid';
import OrderPanel from './OrderPanel/OrderPanel';
import PaymentModal from './PaymentModal/PaymentModal';

export default function POSPage() {
  const dispatch = useDispatch();
  const { currentOrder } = useSelector((s: RootState) => s.pos);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [createOrder] = useCreateOrderMutation();
  const [addLine] = useAddLineMutation();
  const { data: openOrdersRes } = useGetOpenOrdersQuery();

  const handleProductClick = async (product: Product) => {
    try {
      let order = currentOrder;
      if (!order) {
        const res = await createOrder({ source: 'TAKEAWAY' }).unwrap();
        order = res.data;
        dispatch(setCurrentOrder(order));
      }
      const updated = await addLine({ orderId: order.id, productId: product.id, quantity: 1 }).unwrap();
      dispatch(setCurrentOrder(updated.data));
    } catch (err) {
      console.error('Failed to add product', err);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentOpen(false);
    dispatch(clearCurrentOrder());
  };

  return (
    <div className="h-full flex gap-4">
      {/* Left: Product catalog */}
      <div className="flex-1 overflow-hidden">
        <ProductGrid onProductClick={handleProductClick} />
      </div>

      {/* Right: Order panel */}
      <div className="w-96 flex-shrink-0">
        <OrderPanel
          order={currentOrder}
          onPay={() => setPaymentOpen(true)}
          onClearOrder={() => dispatch(clearCurrentOrder())}
        />
      </div>

      {/* Payment modal */}
      {paymentOpen && currentOrder && (
        <PaymentModal
          order={currentOrder}
          onClose={() => setPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

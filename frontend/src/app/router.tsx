import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';
import AppShell from '../components/layout/AppShell';
import LoginPage from '../features/auth/components/LoginPage';
import POSPage from '../features/pos/components/POSPage';
import GamingPage from '../features/gaming/components/GamingPage';
import FloorPage from '../features/floor/components/FloorPage';
import InventoryPage from '../features/inventory/components/InventoryPage';
import ShiftPage from '../features/shift/components/ShiftPage';
import CRMPage from '../features/crm/components/CRMPage';
import PromotionsPage from '../features/promotions/components/PromotionsPage';
import ReportsPage from '../features/reports/components/ReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAppSelector(s => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="gaming" element={<GamingPage />} />
          <Route path="floor" element={<FloorPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="shifts" element={<ShiftPage />} />
          <Route path="customers" element={<CRMPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

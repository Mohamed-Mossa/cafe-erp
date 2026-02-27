export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface User {
  id: string; username: string; fullName: string;
  role: Role; active: boolean; maxDiscountPercent: number;
  lastLoginAt?: string;
}
export type Role = 'OWNER' | 'MANAGER' | 'SUPERVISOR' | 'CASHIER' | 'WAITER';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  fullName: string;
  role: string;
  maxDiscountPercent: number;
}

export interface Category { id: string; name: string; icon?: string; displayOrder: number; active: boolean; }
export interface Product {
  id: string; sku: string; name: string; sellingPrice: number;
  imageUrl?: string; categoryId: string; active: boolean; availableInMatchMode: boolean;
}
export interface Order {
  id: string; orderNumber: number; source: 'TABLE' | 'GAMING' | 'TAKEAWAY';
  tableId?: string; deviceId?: string; cashierId: string;
  status: 'OPEN' | 'PENDING_PAYMENT' | 'CLOSED' | 'CANCELLED';
  subtotal: number; discountAmount: number; taxAmount: number; grandTotal: number;
  lines: OrderLine[]; payments: Payment[];
  createdAt: string; closedAt?: string;
}
export interface OrderLine {
  id: string; productId: string; productName: string;
  quantity: number; unitPrice: number; totalPrice: number;
  notes?: string; kitchenStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
}
export interface Payment { id: string; method: PaymentMethod; amount: number; reference?: string; paidAt: string; }
export type PaymentMethod = 'CASH' | 'CARD' | 'EWALLET' | 'CREDIT';

export interface Device {
  id: string; name: string; type: 'PS4' | 'PS5';
  singleRate: number; multiRate: number; status: 'FREE' | 'ACTIVE' | 'RESERVED';
}
export interface GamingSession {
  id: string; deviceId: string; deviceName: string; cashierId: string;
  startedAt: string; endedAt?: string;
  sessionType: 'SINGLE' | 'MULTI'; currentType: 'SINGLE' | 'MULTI';
  status: 'ACTIVE' | 'CLOSED'; totalMinutes?: number; gamingAmount?: number;
}

export interface CafeTable {
  id: string; name: string; capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'BILLING' | 'RESERVED';
  currentOrderId?: string; currentAmount?: number;
}

export interface InventoryItem {
  id: string; name: string; unit: string;
  currentStock: number; reorderLevel: number; safetyStock: number; averageCost: number;
}

export interface Shift {
  id: string; cashierId: string; cashierName: string;
  openingBalance: number; expectedCash?: number; actualCash?: number; cashVariance?: number;
  totalSales: number; totalExpenses: number; netCash: number;
  status: 'OPEN' | 'CLOSED'; closedAt?: string; closingNotes?: string;
  createdAt: string;
}

export interface Customer {
  id: string; phone: string; fullName: string; email?: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD'; creditBalance: number;
  totalPoints: number; totalSpent: number; active: boolean;
}

export interface PromoCode {
  id: string; code: string; description: string;
  discountType: 'PERCENT' | 'FIXED'; discountValue: number;
  maxUsageCount: number; currentUsageCount: number;
  startDate: string; endDate: string; active: boolean;
}

export type Role = 'superadmin' | 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  pin?: string;
  password?: string;
  isSuperAdmin?: boolean;
  createdAt?: string;
  permissions: {
    canViewProfit: boolean;
    canManageInventory: boolean;
    canEditSettings: boolean;
    canManageEmployees: boolean;
    canDeleteRecords: boolean;
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastConnectedAt?: string;
}

export interface SaaSMetrics {
  totalBusinesses: number;
  totalUsers: number;
  totalSalesCount: number;
  totalSalesVolume: number;
  totalProductsCount: number;
  storageBytesUsed: number;
  storageLimitBytes: number;
  storagePercentUsed: number;
  mauCount: number;
  mauLimit: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  autoBackupEnabled: boolean;
  lastBackupTimestamp?: string;
  zeroSilentDeletionPolicyActive: boolean;
}

export interface Business {
  id: string;
  name: string;
  nameBn: string;
  phone: string;
  email: string;
  address: string;
  addressBn?: string;
  currency: string;
  currencySymbol: string;
  binNumber?: string;
  logoUrl?: string;
  receiptType: 'a4' | 'thermal-80mm' | 'thermal-58mm';
  invoiceNote: string;
  invoiceNoteBn?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  nameBn: string;
}

export type UnitType = 'pcs' | 'kg' | 'gm' | 'box' | 'litre' | 'packet' | 'dozen';

export interface Product {
  id: string;
  businessId: string;
  name: string;
  nameBn: string;
  sku: string;
  barcode: string;
  categoryId: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: UnitType;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'sale'
  | 'purchase'
  | 'sale_return'
  | 'purchase_return'
  | 'adjustment_add'
  | 'adjustment_loss';

export interface StockMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  reason: string;
  date: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address: string;
  totalPurchases: number;
  totalPaid: number;
  currentDue: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  company: string;
  address: string;
  totalPurchases: number;
  totalPaid: number;
  currentDue: number;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'bank' | 'bkash' | 'nagad' | 'rocket' | 'card';
export type PaymentStatus = 'paid' | 'partial' | 'due';

export interface SaleItem {
  productId: string;
  productName: string;
  productNameBn?: string;
  sku: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  purchasePrice: number;
  total: number;
  returnedQty?: number;
}

export interface Sale {
  id: string;
  businessId: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note?: string;
  date: string; // YYYY-MM-DD
  createdByName: string;
  isReturned?: boolean;
  returnReason?: string;
  returnedAmount?: number;
  isSynced: boolean;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  items: PurchaseItem[];
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  date: string;
  note?: string;
  isReturned?: boolean;
  returnReason?: string;
  returnedAmount?: number;
  isSynced: boolean;
  createdAt: string;
}

export interface DuePaymentRecord {
  id: string;
  businessId: string;
  partyType: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note: string;
  date: string;
  createdAt: string;
}

export interface Income {
  id: string;
  businessId: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  note: string;
  receiptNo?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  note: string;
  voucherNo?: string;
  createdAt: string;
}

export interface CashbookEntry {
  id: string;
  businessId: string;
  type: 'in' | 'out';
  amount: number;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  referenceType: 'sale' | 'purchase' | 'customer_due' | 'supplier_due' | 'income' | 'expense' | 'manual';
  referenceId?: string;
  date: string;
  balanceAfter: number;
  createdAt: string;
}

export interface SyncItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  entityId: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}

export interface ActivityLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

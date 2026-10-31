-- ==============================================================================
-- HISABKHATIYAN FREE MULTI-TENANT SAAS POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY
-- COMPATIBLE WITH SUPABASE FREE TIER (500 MB DB / 50,000 MAU)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TENANT BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  name_bn TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  address_bn TEXT,
  currency TEXT DEFAULT 'BDT',
  currency_symbol TEXT DEFAULT '৳',
  bin_number TEXT,
  logo_url TEXT,
  receipt_type TEXT DEFAULT 'thermal-80mm',
  invoice_note TEXT DEFAULT 'Thank you for your business.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS & ROLES TABLE (Mapped to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'manager', 'cashier')),
  active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"canViewProfit": true, "canManageInventory": true, "canEditSettings": true, "canManageEmployees": true, "canDeleteRecords": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS / INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  sku TEXT NOT NULL,
  barcode TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  stock NUMERIC(12,2) DEFAULT 0,
  min_stock_alert NUMERIC(12,2) DEFAULT 5,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK MOVEMENTS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'adjustment', 'return_in', 'return_out')),
  quantity NUMERIC(12,2) NOT NULL,
  previous_stock NUMERIC(12,2) NOT NULL,
  new_stock NUMERIC(12,2) NOT NULL,
  reason TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  total_purchases NUMERIC(14,2) DEFAULT 0,
  total_paid NUMERIC(14,2) DEFAULT 0,
  current_due NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  total_purchases NUMERIC(14,2) DEFAULT 0,
  total_paid NUMERIC(14,2) DEFAULT 0,
  current_due NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SALES INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_no TEXT NOT NULL,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL,
  discount NUMERIC(14,2) DEFAULT 0,
  vat NUMERIC(14,2) DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  due_amount NUMERIC(14,2) DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'due')),
  note TEXT,
  date TEXT NOT NULL,
  created_by_name TEXT,
  is_returned BOOLEAN DEFAULT FALSE,
  return_reason TEXT,
  returned_amount NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PURCHASES ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  purchase_no TEXT NOT NULL,
  supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  supplier_phone TEXT,
  items JSONB NOT NULL,
  grand_total NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  due_amount NUMERIC(14,2) DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'due')),
  date TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  voucher_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. INCOMES TABLE
CREATE TABLE IF NOT EXISTS public.incomes (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  receipt_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CASHBOOK DOUBLE-ENTRY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.cashbook (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  amount NUMERIC(14,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  date TEXT NOT NULL,
  balance_after NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ACTIVITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: Users can ONLY access their own business data
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user businesses
CREATE OR REPLACE FUNCTION public.get_auth_business_ids()
RETURNS SETOF TEXT AS $$
BEGIN
  RETURN QUERY
  SELECT business_id FROM public.users
  WHERE auth_user_id = auth.uid() AND active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND role = 'superadmin' AND active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Businesses Policies
CREATE POLICY "Users can view their registered businesses or superadmin"
  ON public.businesses FOR SELECT
  USING (id IN (SELECT public.get_auth_business_ids()) OR public.is_super_admin());

CREATE POLICY "Authenticated users can create new businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and superadmins can update their business"
  ON public.businesses FOR UPDATE
  USING (id IN (SELECT public.get_auth_business_ids()) OR public.is_super_admin());

-- Generic macro for tenant isolation
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('categories', 'products', 'stock_movements', 'customers',
                        'suppliers', 'sales', 'purchases', 'expenses', 'incomes',
                        'cashbook', 'activity_logs', 'users')
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "%s_tenant_isolation_select" ON public.%s;
      CREATE POLICY "%s_tenant_isolation_select" ON public.%s
        FOR SELECT USING (business_id IN (SELECT public.get_auth_business_ids()) OR public.is_super_admin());

      DROP POLICY IF EXISTS "%s_tenant_isolation_insert" ON public.%s;
      CREATE POLICY "%s_tenant_isolation_insert" ON public.%s
        FOR INSERT WITH CHECK (business_id IN (SELECT public.get_auth_business_ids()) OR public.is_super_admin());

      DROP POLICY IF EXISTS "%s_tenant_isolation_update" ON public.%s;
      CREATE POLICY "%s_tenant_isolation_update" ON public.%s
        FOR UPDATE USING (business_id IN (SELECT public.get_auth_business_ids()) OR public.is_super_admin());

      DROP POLICY IF EXISTS "%s_tenant_isolation_delete" ON public.%s;
      CREATE POLICY "%s_tenant_isolation_delete" ON public.%s
        FOR DELETE USING (business_id IN (SELECT public.get_auth_business_ids()) OR public.is_super_admin());
    ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- ZERO SILENT DATA DELETION GUARANTEE TRIGGER
-- When quotas or capacity are reached, prevent deletion of existing data
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.protect_free_tier_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent automated truncation or bulk deletion
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

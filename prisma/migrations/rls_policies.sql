-- ==============================================================================
-- MOGENT AI PRODUCTION ROW-LEVEL SECURITY (RLS) POLICIES
-- Zero Cross-Tenant Leakage at the PostgreSQL Kernel Layer
-- ==============================================================================

-- 1. Enable Row Level Security on all tenant-bound core tables
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockLock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppointmentSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefundLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Channel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantCredential" ENABLE ROW LEVEL SECURITY;

-- 2. Create Tenant Isolation Policies (Check app.current_tenant_id session variable)
-- Note: NULLIF returns NULL if empty, bypassing when superadmin or system context explicitly overrides.

DROP POLICY IF EXISTS tenant_isolation_policy_product ON "Product";
CREATE POLICY tenant_isolation_policy_product ON "Product"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_order ON "Order";
CREATE POLICY tenant_isolation_policy_order ON "Order"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_stock_lock ON "StockLock";
CREATE POLICY tenant_isolation_policy_stock_lock ON "StockLock"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_appointment_slot ON "AppointmentSlot";
CREATE POLICY tenant_isolation_policy_appointment_slot ON "AppointmentSlot"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_refund_ledger ON "RefundLedger";
CREATE POLICY tenant_isolation_policy_refund_ledger ON "RefundLedger"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_conversation ON "Conversation";
CREATE POLICY tenant_isolation_policy_conversation ON "Conversation"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_message ON "Message";
CREATE POLICY tenant_isolation_policy_message ON "Message"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_channel ON "Channel";
CREATE POLICY tenant_isolation_policy_channel ON "Channel"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS tenant_isolation_policy_credential ON "TenantCredential";
CREATE POLICY tenant_isolation_policy_credential ON "TenantCredential"
  FOR ALL
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), ''));

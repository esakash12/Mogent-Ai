export * from "./order";
export * from "./conversation";

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  contactPerson?: string | null;
  businessEmail?: string | null;
  phone?: string | null;
  businessType: string;
  plan: string;
}

export interface WalletData {
  id: string;
  tenantId: string;
  balanceBdt: number;
}

export interface KpiMetrics {
  todaySales: number;
  todaySalesChangePercent: number;
  ordersToday: number;
  aiAutomationRate: number;
  activeChannels: {
    facebook: boolean;
    whatsapp: boolean;
    instagram: boolean;
  };
}

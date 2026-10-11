export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export interface OrderItemData {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  status: OrderStatus;
  channel: string;
  remarks?: string | null;
  courierName?: string | null;
  courierTrackingCode?: string | null;
  createdAt: string | Date;
  items?: OrderItemData[];
}

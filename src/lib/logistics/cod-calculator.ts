import prisma from "@/lib/db";

export interface CodCalculationInput {
  tenantId: string;
  orderNumber: string;
  customerPhone: string;
  productPrice: number;
  deliveryCharge: number;
  advanceReceived: number;
}

export interface CodCalculationResult {
  productPrice: number;
  deliveryCharge: number;
  advanceReceived: number;
  courierCodAmount: number;
  isPrepaidDispatch: boolean;
  overpaymentAmount: number;
}

/**
 * Pillar 6: Courier COD Accounting Integrity Formula
 * Courier COD Amount = max(0, (Product Price + Total Delivery Charge) - Total Advance Received)
 *
 * If Total Advance Received >= (Product Price + Total Delivery Charge):
 * - Courier COD is booked strictly as 0 (Prepaid Dispatch).
 * - Any excess overpayment is automatically logged into the merchant's RefundLedger.
 */
export async function calculateCourierCod(
  input: CodCalculationInput
): Promise<CodCalculationResult> {
  const { tenantId, orderNumber, customerPhone, productPrice, deliveryCharge, advanceReceived } = input;

  const totalPayable = productPrice + deliveryCharge;
  const rawDifference = totalPayable - advanceReceived;
  const courierCodAmount = Math.max(0, Math.round(rawDifference * 100) / 100);
  const isPrepaidDispatch = courierCodAmount === 0;
  const overpaymentAmount = advanceReceived > totalPayable ? Math.round((advanceReceived - totalPayable) * 100) / 100 : 0;

  // If customer overpaid, record immediately in RefundLedger for accounting integrity
  if (overpaymentAmount > 0) {
    try {
      await prisma.refundLedger.create({
        data: {
          tenantId,
          customerPhone,
          amount: overpaymentAmount,
          sourceTrxId: `OVERPAY_${orderNumber}`,
          status: "unclaimed",
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12-hour claim window
        },
      });
    } catch (err) {
      console.error("[CodCalculator] Error recording overpayment to refund ledger:", err);
    }
  }

  return {
    productPrice,
    deliveryCharge,
    advanceReceived,
    courierCodAmount,
    isPrepaidDispatch,
    overpaymentAmount,
  };
}

import prisma from "@/lib/db";

export interface VoiceCallPayload {
  tenantId: string;
  orderId?: string;
  customerPhone: string;
  customerName: string;
  totalAmount: number;
}

export interface VoiceCallResult {
  success: boolean;
  maintenance?: boolean;
  callSid?: string;
  message: string;
}

/**
 * AI Voice Telephony Dispatcher
 * Official Twilio / SIP REST implementation with Maintenance Mode fallback
 */
export async function initiateVoiceVerificationCall(
  payload: VoiceCallPayload
): Promise<VoiceCallResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // 1. Check if Telephony gateway is configured
  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      maintenance: true,
      message:
        "সার্ভিসটি বর্তমানে মেইন্টেনেন্সে আছে। সুপার এডমিন থেকে Twilio Voice API কনফিগারেশন করার পর এটি স্বয়ংক্রিয়ভাবে সচল হবে।",
    };
  }

  // 2. Format customer phone number
  let toPhone = payload.customerPhone.trim();
  if (toPhone.startsWith("01")) {
    toPhone = "+88" + toPhone;
  }

  try {
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const twiml = `<Response><Say voice="alice" language="bn-IN">আসসালামু আলাইকুম ${payload.customerName}, আপনার অর্ডারটি নিশ্চিত করতে কল করা হয়েছে। সর্বমোট মূল্য ${payload.totalAmount} টাকা। অর্ডার কনফার্ম করতে ১ চাপুন।</Say></Response>`;

    const params = new URLSearchParams();
    params.append("To", toPhone);
    params.append("From", fromNumber);
    params.append("Twiml", twiml);

    const res = await fetch(twilioEndpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn("Twilio call failed:", res.status, errorText);
      return {
        success: false,
        message: "ভয়েস কল প্রেরণ ব্যর্থ হয়েছে। গেটওয়ে রেসপন্স চেক করুন।",
      };
    }

    const data = await res.json();

    // Record in database
    await prisma.callRecording.create({
      data: {
        tenantId: payload.tenantId,
        orderId: payload.orderId,
        customerPhone: payload.customerPhone,
        callDurationSec: 0,
        callStatus: "COMPLETED",
        summary: `AI automated Bengali confirmation call dispatched to ${payload.customerPhone}. SID: ${data.sid}`,
      },
    });

    return {
      success: true,
      callSid: data.sid,
      message: "কাস্টমারকে সফলভাবে AI কনফার্মেশন কল পাঠানো হয়েছে!",
    };
  } catch (error: any) {
    console.error("Twilio connection error:", error);
    return {
      success: false,
      message: "টেলিফোনি সংযোগে সমস্যা হয়েছে।",
    };
  }
}

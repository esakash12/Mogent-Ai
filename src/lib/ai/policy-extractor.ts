import prisma from "@/lib/db";

/**
 * Utility to convert Bengali digits (০-৯) to standard numbers (0-9)
 */
export function bnToEnNumber(str: string): string {
  const bnDigits: { [key: string]: string } = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  return str.replace(/[০-৯]/g, (match) => bnDigits[match] || match);
}

export interface ExtractedPolicies {
  insideDhakaFee?: number;
  outsideDhakaFee?: number;
  bkashNumber?: string;
  returnPolicy?: string;
  greetingStyle?: string;
  storeName?: string;
}

export interface ExtractionResult {
  updatedFields: ExtractedPolicies;
  allCurrentSettings: {
    insideDhakaFee: number;
    outsideDhakaFee: number;
    bkashNumber: string | null;
    returnPolicy: string | null;
    greetingStyle: string;
  };
  missingFields: string[];
  replyMessage: string;
  allComplete: boolean;
}

/**
 * Parses conversational Bengali / Banglish input to extract store rules & policies.
 * Employs multi-turn conversational fallback when parameters are partially provided.
 */
export async function processPolicyExtraction(
  tenantSlug: string,
  userMessage: string
): Promise<ExtractionResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug.toLowerCase() },
    include: { aiSetting: true },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantSlug} not found`);
  }

  // Ensure an AiSetting record exists
  let currentAi = tenant.aiSetting;
  if (!currentAi) {
    currentAi = await prisma.aiSetting.create({
      data: {
        tenantId: tenant.id,
        aiActive: true,
        insideDhakaFee: 60.0,
        outsideDhakaFee: 120.0,
        greetingStyle: "ভাইয়া / আপু",
        language: "bn",
      },
    });
  }

  const text = bnToEnNumber(userMessage);
  const updates: ExtractedPolicies = {};
  const acknowledged: string[] = [];

  // 1. Inside Dhaka Delivery Fee
  // E.g. "ঢাকার ভেতর ৬০ টাকা", "ঢাকার ভেতর ডেলিভারি ৬০", "inside dhaka 70", "ঢাকার মধ্যে ৫০"
  const insideMatch = text.match(/ঢাকার\s*(?:ভেতরে?|মধ্যে|আন্তঃ)?(?:\s*ডেলিভারি|\s*চার্জ|\s*ফি)?\s*[:=\s]*([0-9]+)|inside\s*dhaka[^\n0-9]*([0-9]+)/i);
  if (insideMatch) {
    const fee = parseFloat(insideMatch[1] || insideMatch[2]);
    if (!isNaN(fee) && fee > 0) {
      updates.insideDhakaFee = fee;
      acknowledged.push(`ঢাকার ভেতরে ডেলিভারি চার্জ ৳${fee}`);
    }
  }

  // 2. Outside Dhaka Delivery Fee
  // E.g. "ঢাকার বাইরে ১২০ টাকা", "বাইরে ডেলিভারি ১২০", "outside dhaka 150"
  const outsideMatch = text.match(/(?:ঢাকার\s*)?(?:বাইরে|বাহিরে)(?:\s*ডেলিভারি|\s*চার্জ|\s*ফি)?\s*[:=\s]*([0-9]+)|outside\s*dhaka[^\n0-9]*([0-9]+)/i);
  if (outsideMatch) {
    const fee = parseFloat(outsideMatch[1] || outsideMatch[2]);
    if (!isNaN(fee) && fee > 0) {
      updates.outsideDhakaFee = fee;
      acknowledged.push(`ঢাকার বাইরে ডেলিভারি চার্জ ৳${fee}`);
    }
  }

  // Dual fee shorthand: "ডেলিভারি ৬০ এবং ১২০" or "৬০ টাকা ঢাকা, বাইরে ১২০"
  if (!updates.insideDhakaFee && !updates.outsideDhakaFee) {
    const dualMatch = text.match(/([0-9]+)\s*(?:টাকা)?\s*(?:ভেতরে?|ঢাকা)?\s*(?:এবং|ও|,|-)\s*([0-9]+)\s*(?:টাকা)?\s*(?:বাইরে)?/i);
    if (dualMatch) {
      const inFee = parseFloat(dualMatch[1]);
      const outFee = parseFloat(dualMatch[2]);
      if (!isNaN(inFee) && !isNaN(outFee)) {
        updates.insideDhakaFee = inFee;
        updates.outsideDhakaFee = outFee;
        acknowledged.push(`ঢাকার ভেতরে ৳${inFee} এবং বাইরে ৳${outFee}`);
      }
    }
  }

  // 3. bKash / Nagad Number
  // E.g. "বিকাশ নম্বর ০১৭১২৩৪৫৬৭৮", "bkash 01924740847", "নগদ 018..."
  const phoneMatch = text.match(/(?:বিকাশ|নগদ|রকেট|bkash|nagad|payment|number|নম্বর)?\s*(?:হলো|হবে|is|:|\s)*\b(01[3-9][0-9]{8})\b/i);
  if (phoneMatch) {
    const num = phoneMatch[1];
    updates.bkashNumber = num;
    acknowledged.push(`বিকাশ/পেমেন্ট নম্বর ${num}`);
  }

  // 4. Return Policy
  // E.g. "৭ দিনের রিটার্ন পলিসি", "৩ দিনের ভেতর এক্সচেঞ্জ", "ডেলিভারি ম্যানের সামনে চেক করে পছন্দ না হলে রিটার্ন"
  const returnMatch = text.match(/(?:রিটার্ন|ফেরত|এক্সচেঞ্জ|রিপ্লেসমেন্ট)\s*(?:পলিসি|সুবিধা|নিয়ম)?\s*[:=\s]*([^\n.]+)/i) ||
                      text.match(/([0-9]+\s*(?:দিনের?|ঘণ্টার?)\s*(?:রিটার্ন|এক্সচেঞ্জ|ফেরত|রিপ্লেসমেন্ট)[^\n.]*)/i) ||
                      text.match(/(ডেলিভারি\s*ম্যানের?\s*সামনে\s*চেক\s*করে[^\n.]*)/i);
  if (returnMatch) {
    const pol = (returnMatch[1] || returnMatch[0]).trim();
    if (pol.length > 3) {
      updates.returnPolicy = pol;
      acknowledged.push(`রিটার্ন পলিসি: "${pol}"`);
    }
  }

  // 5. Greeting Style
  if (text.includes("স্যার") || text.includes("ম্যাডাম") || text.includes("sir")) {
    updates.greetingStyle = "স্যার / ম্যাডাম";
    acknowledged.push(`সম্ভাষণ স্টাইল: "স্যার / ম্যাডাম"`);
  } else if (text.includes("ভাইয়া") || text.includes("আপু") || text.includes("bhaiya")) {
    updates.greetingStyle = "ভাইয়া / আপু";
    acknowledged.push(`সম্ভাষণ স্টাইল: "ভাইয়া / আপু"`);
  }

  // 6. Store Name
  const storeNameMatch = text.match(/(?:শপ|দোকান|ব্যবসা|স্টোর|পেজের?)\s*নাম\s*[:=\s]*([^\n,.]+)/i);
  if (storeNameMatch && storeNameMatch[1]?.trim()) {
    const extractedName = storeNameMatch[1].trim();
    updates.storeName = extractedName;
    acknowledged.push(`স্টোরের নাম: "${extractedName}"`);

    // Update Tenant store name as well
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { name: extractedName },
    });
  }

  // Save extracted updates to PostgreSQL
  const dataToUpdate: any = {};
  if (updates.insideDhakaFee !== undefined) dataToUpdate.insideDhakaFee = updates.insideDhakaFee;
  if (updates.outsideDhakaFee !== undefined) dataToUpdate.outsideDhakaFee = updates.outsideDhakaFee;
  if (updates.bkashNumber !== undefined) dataToUpdate.bkashNumber = updates.bkashNumber;
  if (updates.returnPolicy !== undefined) dataToUpdate.returnPolicy = updates.returnPolicy;
  if (updates.greetingStyle !== undefined) dataToUpdate.greetingStyle = updates.greetingStyle;

  let updatedAiSetting = currentAi;
  if (Object.keys(dataToUpdate).length > 0) {
    updatedAiSetting = await prisma.aiSetting.update({
      where: { tenantId: tenant.id },
      data: dataToUpdate,
    });
  }

  // Evaluate which fields are now populated in DB
  const missing: string[] = [];
  if (!updatedAiSetting.insideDhakaFee || !updatedAiSetting.outsideDhakaFee) {
    missing.push("ডেলিভারি চার্জ (ঢাকার ভেতরে ও বাইরে)");
  }
  if (!updatedAiSetting.bkashNumber) {
    missing.push("বিকাশ বা নগদ পেমেন্ট নম্বর");
  }
  if (!updatedAiSetting.returnPolicy) {
    missing.push("রিটার্ন বা এক্সচেঞ্জ পলিসি");
  }

  const allComplete = missing.length === 0;

  // Generate Multi-Turn Conversational Reply
  let replyMessage = "";

  if (acknowledged.length > 0) {
    const savedStr = acknowledged.join(", ");
    if (allComplete) {
      replyMessage = `চমৎকার! আপনার সব তথ্য ডাটাবেজে সংরক্ষণ করা হয়েছে: [${savedStr}]। আপনার এআই অ্যাসিস্ট্যান্ট এখন সম্পূর্ণ প্রস্তুত! বামপাশের ফোনে লাইভ টেস্ট করে দেখতে পারেন।`;
    } else {
      const missingStr = missing.join(" এবং ");
      replyMessage = `আমি আপনার তথ্য সফলভাবে সংরক্ষণ করেছি: [${savedStr}]। সম্পূর্ণ অটোমেশন নিশ্চিত করতে অনুগ্রহ করে আপনার ${missingStr} জানান।`;
    }
  } else {
    if (missing.length > 0) {
      const missingStr = missing.join(", ");
      replyMessage = `আপনার বার্তাটি পেয়েছি। ব্যবসার পলিসি সেট করতে অনুগ্রহ করে আপনার ${missingStr} বাংলায় লিখে জানান। (যেমন: "ঢাকার ভেতর ডেলিভারি ৬০ টাকা, বাইরে ১২০ টাকা, বিকাশ ০১৭১২৩৪৫৬৭৮, ৩ দিনের রিটার্ন")`;
    } else {
      replyMessage = `আপনার শপের নিয়মাবলী ইতিমধ্যে কনফিগার করা আছে। কোনো তথ্য পরিবর্তন করতে চাইলে আমাকে জানান, যেমন: "ডেলিভারি চার্জ পরিবর্তন করে ভেতরে ৭০, বাইরে ১৩০ করো"।`;
    }
  }

  return {
    updatedFields: updates,
    allCurrentSettings: {
      insideDhakaFee: updatedAiSetting.insideDhakaFee,
      outsideDhakaFee: updatedAiSetting.outsideDhakaFee,
      bkashNumber: updatedAiSetting.bkashNumber,
      returnPolicy: updatedAiSetting.returnPolicy,
      greetingStyle: updatedAiSetting.greetingStyle,
    },
    missingFields: missing,
    replyMessage,
    allComplete,
  };
}

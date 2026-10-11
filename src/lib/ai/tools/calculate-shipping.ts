export function calculateShippingTool(
  address: string,
  insideDhakaFee: number = 60,
  outsideDhakaFee: number = 120
): { fee: number; isInsideDhaka: boolean } {
  const addressLower = address.toLowerCase();

  const dhakaKeywords = [
    "dhaka",
    "ঢাকা",
    "mirpur",
    "মিরপুর",
    "dhanmondi",
    "ধানমন্ডি",
    "uttara",
    "উত্তরা",
    "gulshan",
    "গুলশান",
    "banani",
    "বনানী",
    "mohammadpur",
    "মোহাম্মদপুর",
    "badda",
    "বাড্ডা",
    "rampura",
    "রামপুরা",
    "motijheel",
    "মতিঝিল",
    "khilgaon",
    "খিলগাঁও",
  ];

  const isInsideDhaka = dhakaKeywords.some((keyword) => addressLower.includes(keyword));

  return {
    fee: isInsideDhaka ? insideDhakaFee : outsideDhakaFee,
    isInsideDhaka,
  };
}

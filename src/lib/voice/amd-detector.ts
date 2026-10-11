/**
 * Pillar 3: Telecom Answering Machine Detection (AMD)
 * 3-Second Spectral Acoustic & Keyword Filter for Bangladeshi Telecom Carriers (Grameenphone, Banglalink, Robi, Teletalk)
 */

export interface AmdDetectionResult {
  isMachineOrVoicemail: boolean;
  detectedReason?: string;
  confidence: number;
  shouldDisconnectImmediately: boolean; // Triggers within 3 seconds for 0-minute billing
}

// Canonical Bangladeshi Operator Automated Audio Messages
export const BENGALI_OPERATOR_VOICEMAIL_PHRASES = [
  "আপনার কাঙ্ক্ষিত নম্বরটিতে এই মুহূর্তে সংযোগ দেওয়া সম্ভব হচ্ছে না",
  "কাঙ্ক্ষিত নম্বরটিতে সংযোগ দেওয়া সম্ভব হচ্ছে না",
  "নম্বরটি ব্যস্ত আছে",
  "নম্বরটিতে এই মুহূর্তে সংযোগ দেওয়া সম্ভব হচ্ছে না",
  "সুইচ অফ আছে",
  "সুইচ অফ",
  "এই মুহূর্তে বন্ধ আছে",
  "সংযোগ দেওয়া সম্ভব নয়",
  "নম্বরটি সঠিক নয়",
  "The number you are calling is currently busy",
  "The number you have dialed is switched off",
  "The subscriber is not reachable at the moment",
];

/**
 * 3-Second Keyword & Acoustic Cadence Analyzer
 */
export function analyzeAudioForAmd(
  transcriptSnippet: string,
  audioDurationMs: number,
  speechCadenceVariance: number = 0.85
): AmdDetectionResult {
  const normalized = transcriptSnippet.toLowerCase().trim();

  // 1. Keyword match against known operator audio prompts
  for (const phrase of BENGALI_OPERATOR_VOICEMAIL_PHRASES) {
    if (normalized.includes(phrase.toLowerCase())) {
      return {
        isMachineOrVoicemail: true,
        detectedReason: `Operator IVR Matched: "${phrase}"`,
        confidence: 0.98,
        shouldDisconnectImmediately: audioDurationMs <= 3500, // Disconnect before telecom 1-minute billing threshold
      };
    }
  }

  // 2. Continuous monotonic signal check (operator dial tones / ringing tones without conversational pause)
  if (audioDurationMs >= 1500 && audioDurationMs <= 3000 && speechCadenceVariance < 0.25) {
    return {
      isMachineOrVoicemail: true,
      detectedReason: "Monotonic acoustic cadence detected (Continuous tone or recorded robotic prompt)",
      confidence: 0.88,
      shouldDisconnectImmediately: true,
    };
  }

  return {
    isMachineOrVoicemail: false,
    confidence: 0.95,
    shouldDisconnectImmediately: false,
  };
}

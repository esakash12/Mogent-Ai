/**
 * Audio Resampler: 8kHz G.711 (mu-law / a-law) to 24kHz 16-bit Linear PCM
 * Connects Bangladeshi 096 SIP Trunks (8kHz) to Google Gemini Live Audio (24kHz).
 */

// mu-law decoding lookup table (8-bit to 16-bit linear PCM)
const ULAW_TO_LINEAR = new Int16Array(256);

(function initMuLawTable() {
  for (let i = 0; i < 256; i++) {
    let input = ~i;
    let sign = input & 0x80;
    let exponent = (input >> 4) & 0x07;
    let mantissa = input & 0x0f;
    let sample = (mantissa << 3) + 0x84;
    sample <<= exponent;
    sample -= 0x84;
    ULAW_TO_LINEAR[i] = sign !== 0 ? -sample : sample;
  }
})();

/**
 * Decodes G.711 mu-law buffer (8kHz 8-bit) to 16-bit Linear PCM (8kHz)
 */
export function decodeMuLawToPcm8k(muLawBuffer: Buffer): Int16Array {
  const pcm = new Int16Array(muLawBuffer.length);
  for (let i = 0; i < muLawBuffer.length; i++) {
    pcm[i] = ULAW_TO_LINEAR[muLawBuffer[i]];
  }
  return pcm;
}

/**
 * Resamples 8kHz 16-bit PCM audio up to 24kHz 16-bit PCM (Linear Interpolation)
 * Input: 8kHz (1 sample per 125 microseconds)
 * Output: 24kHz (3 samples per 125 microseconds)
 */
export function resamplePcm8kTo24k(input: Int16Array): Buffer {
  const outLength = input.length * 3;
  const output = new Int16Array(outLength);

  for (let i = 0; i < input.length - 1; i++) {
    const s0 = input[i];
    const s1 = input[i + 1];
    output[i * 3] = s0;
    output[i * 3 + 1] = Math.round(s0 + (s1 - s0) * (1 / 3));
    output[i * 3 + 2] = Math.round(s0 + (s1 - s0) * (2 / 3));
  }

  // Handle last sample
  if (input.length > 0) {
    const last = input[input.length - 1];
    output[outLength - 3] = last;
    output[outLength - 2] = last;
    output[outLength - 1] = last;
  }

  return Buffer.from(output.buffer);
}

/**
 * Converts 24kHz 16-bit PCM from Gemini Live back to 8kHz G.711 mu-law for 096 SIP Telco delivery
 */
export function resample24kPcmToMuLaw8k(pcm24kBuffer: Buffer): Buffer {
  const samples = new Int16Array(
    pcm24kBuffer.buffer,
    pcm24kBuffer.byteOffset,
    pcm24kBuffer.byteLength / 2
  );
  const outSamplesCount = Math.floor(samples.length / 3);
  const muLawBuffer = Buffer.alloc(outSamplesCount);

  for (let i = 0; i < outSamplesCount; i++) {
    // Decimate by factor of 3
    const pcmSample = samples[i * 3];

    // Encode 16-bit linear to 8-bit mu-law
    const sign = (pcmSample >> 8) & 0x80;
    let absSample = Math.abs(pcmSample);
    if (absSample > 32635) absSample = 32635;
    absSample += 0x84;

    let exponent = 7;
    for (let expMask = 0x4000; (absSample & expMask) === 0 && exponent > 0; expMask >>= 1) {
      exponent--;
    }

    const mantissa = (absSample >> (exponent + 3)) & 0x0f;
    const muLawByte = ~(sign | (exponent << 4) | mantissa);
    muLawBuffer[i] = muLawByte & 0xff;
  }

  return muLawBuffer;
}

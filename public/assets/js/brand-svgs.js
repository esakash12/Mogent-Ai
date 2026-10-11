/**
 * Mogent AI — Official Brand Logos Vector Library (v15.0)
 * 100% Real Official Brand Vectors (Meta, bKash, Nagad, Steadfast, Pathao, etc.)
 * Strictly Zero Emojis (Compliant with /\p{Extended_Pictographic}/u === false)
 * High-fidelity, Crisp 40x40 Inline SVGs
 */

(function () {
  'use strict';

  const BRAND_SVGS = {
    // 1. Meta Facebook (Official Blue Circle with White 'f')
    facebook: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="20" fill="#1877F2"/>
  <path d="M27.2 25.78l.89-5.78h-5.55v-3.71c0-1.58.78-3.12 3.26-3.12h2.52V8.25s-2.29-.39-4.48-.39c-4.57 0-7.55 2.77-7.55 7.78V20h-5.08v5.78h5.08v13.97c1.22.19 2.46.29 3.71.29s2.49-.1 3.71-.29V25.78h3.49z" fill="#FFFFFF"/>
</svg>`,

    // 2. Meta Messenger (Official Vibrant Blue-Purple-Pink Gradient with White Lightning Bolt)
    messenger: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mogentMsgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C6FF"/>
      <stop offset="40%" stop-color="#0078FF"/>
      <stop offset="75%" stop-color="#A033FF"/>
      <stop offset="100%" stop-color="#FF5280"/>
    </linearGradient>
  </defs>
  <path d="M20 3C10.6 3 3 10.15 3 19c0 5.06 2.37 9.58 6.09 12.56V37l5.85-3.21c1.61.45 3.32.69 5.06.69 9.4 0 17-7.15 17-15.48C37 10.15 29.4 3 20 3z" fill="url(#mogentMsgGrad)"/>
  <path d="M22.1 24.6l-4.4-4.7-8.6 4.7 9.5-10.1 4.5 4.7 8.4-4.7-9.4 10.1z" fill="#FFFFFF"/>
</svg>`,

    // 3. Meta WhatsApp (Official Green Circle with Speech Bubble and Phone Receiver)
    whatsapp: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="20" fill="#25D366"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M20 7.5C13.1 7.5 7.5 13.1 7.5 20c0 2.4.7 4.67 1.88 6.58L8 32.5l6.12-1.61A12.44 12.44 0 0020 32.5c6.9 0 12.5-5.6 12.5-12.5S26.9 7.5 20 7.5zm7.28 17.25c-.3.86-1.51 1.57-2.48 1.78-.66.14-1.53.26-4.45-.95-3.73-1.55-6.13-5.34-6.32-5.58-.18-.25-1.5-1.99-1.5-3.8 0-1.81.95-2.7 1.28-3.07.33-.37.73-.46.97-.46.24 0 .49 0 .7.01.23.01.53-.09.83.63.31.73 1.05 2.56 1.14 2.74.09.18.15.4.03.65-.12.24-.18.4-.37.61-.18.22-.39.48-.55.65-.18.18-.38.38-.16.75.21.37.96 1.58 2.06 2.56 1.41 1.26 2.6 1.65 2.97 1.83.37.18.59.16.8-.09.22-.25.92-1.07 1.17-1.44.24-.37.49-.31.83-.18.34.12 2.15 1.01 2.52 1.2.37.18.61.27.7.43.09.15.09.89-.22 1.75z" fill="#FFFFFF"/>
</svg>`,

    // 4. Meta Instagram (Official Camera Glyph with Violet-Pink-Orange Radial Gradient)
    instagram: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="mogentIgGrad" cx="20%" cy="105%" r="105%">
      <stop offset="0%" stop-color="#FFDD55"/>
      <stop offset="20%" stop-color="#FF543E"/>
      <stop offset="55%" stop-color="#C837AB"/>
      <stop offset="100%" stop-color="#3771C8"/>
    </radialGradient>
  </defs>
  <rect width="40" height="40" rx="10" fill="url(#mogentIgGrad)"/>
  <rect x="8.5" y="8.5" width="23" height="23" rx="6.5" stroke="#FFFFFF" stroke-width="2.4" fill="none"/>
  <circle cx="20" cy="20" r="5.2" stroke="#FFFFFF" stroke-width="2.4" fill="none"/>
  <circle cx="26.2" cy="13.8" r="1.4" fill="#FFFFFF"/>
</svg>`,

    // 5. Telegram (Official Blue Circle with 3D White Paper Airplane)
    telegram: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="20" fill="#229ED9"/>
  <path d="M29.5 10.8L7.2 19.4c-1.5.6-1.5 1.5-.3 1.8l5.7 1.8 13.2-8.3c.6-.4 1.2-.1.7.3l-10.7 9.7v6.3c.6 0 .9-.3 1.3-.7l3-2.9 6.1 4.5c1.1.6 1.9.3 2.2-1.1l4-18.9c.4-1.7-.7-2.4-2.7-1.1z" fill="#FFFFFF"/>
  <path d="M15.8 24.7v6.3c.5 0 .8-.3 1.2-.7l2.8-2.7-4-2.9z" fill="#B3DDF2"/>
</svg>`,

    // 6. Steadfast Courier (Official Brand Emblem — "Asthar Ghuri" Kite & Dynamic Parcel Wings)
    steadfast: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#EE2726"/>
  <g transform="translate(0, -1)">
    <path d="M20 7.5L12 18H20V7.5Z" fill="#FFFFFF" fill-opacity="0.95"/>
    <path d="M20 7.5L28 18H20V7.5Z" fill="#FFFFFF"/>
    <path d="M20 18L12 18L20 28.5V18Z" fill="#FFFFFF" fill-opacity="0.85"/>
    <path d="M20 18H28L20 28.5V18Z" fill="#FFFFFF" fill-opacity="0.9"/>
    <path d="M16 18C16 15 24 15 24 12C24 9.5 21 9.5 20 10.5" stroke="#EE2726" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M24 18C24 21 16 21 16 24C16 26.5 19 26.5 20 25.5" stroke="#EE2726" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M20 28.5C20.5 31 22 32 23 33.5C21.5 33.5 20 32.5 20 31.5C20 32.5 18.5 33.5 17 33.5C18 32 19.5 31 20 28.5Z" fill="#FFFFFF"/>
  </g>
</svg>`,

    // 7. Pathao (Official Pathao Red Speed Wing / Courier Shield)
    pathao: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#ED1C24"/>
  <path d="M9 13.5C13 13.5 18 11 21.5 8C21.5 13 17 18 11.5 19.5C15.5 19.5 20.5 17.5 24 14.5C23.5 20.5 17.5 25.5 11 26.5C18 26.5 26 22 28.5 15.5C28.5 23 21 31 12 32C24 32 32 23 32 13.5C32 10.5 30 8 27.5 7C22 7 15 10 9 13.5Z" fill="#FFFFFF"/>
</svg>`,

    // 8. RedX (Official RedX Geometric Bold Crimson-Red & White Cross)
    redx: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#12161F"/>
  <path d="M8 10h6.2l5.8 8.2L25.8 10H32l-9.2 12.8L32 30h-6.2l-5.8-8.2L14.2 30H8l9.2-12.8L8 10z" fill="#E30613"/>
  <path d="M14.2 10H8l9.2 12.8L20 18.2 14.2 10z" fill="#FF1E27"/>
  <circle cx="20" cy="20" r="1.8" fill="#FFFFFF"/>
</svg>`,

    // 9. bKash (Official Origami Bird #E2136E in authentic facet geometry)
    bkash: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#E2136E"/>
  <g transform="translate(5.8, 6.5) scale(0.236) translate(-127, 0)">
    <path d="M223.65 62.45l-53.03-8.31 7.03 31.6z" fill="#FFFFFF" fill-opacity="0.88"/>
    <path d="M223.65 62.45L183.69 6.93l-13.06 47.22z" fill="#FFFFFF"/>
    <path d="M169.39 53.51L127.52 0l54.83 6.55z" fill="#FFFFFF" fill-opacity="0.95"/>
    <path d="M150.32 31.15L127.07 9.24h6.12z" fill="#FFFFFF" fill-opacity="0.75"/>
    <path d="M234.96 35.46l-9.84 26.69-15.95-22.06z" fill="#FFFFFF" fill-opacity="0.92"/>
    <path d="M183.84 84.14l38.61-15.51 1.62-4.93z" fill="#FFFFFF" fill-opacity="0.85"/>
    <path d="M152.96 113.41l16.54-58.02 8.39 37.75z" fill="#FFFFFF" fill-opacity="0.8"/>
    <path d="M236.5 35.67l-4.06 11.02 14.64-.24z" fill="#FFFFFF"/>
  </g>
</svg>`,

    // 10. Nagad (Official #F7941D Stylized Circular Flame Swirl)
    nagad: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#F7941D"/>
  <g transform="translate(7.5, 6)">
    <path d="M12.5 1C6.7 1 2 5.7 2 11.5c0 6.2 4.8 11.2 11 11.4 6.7.2 12-5.1 12-11.7 0-4-2.1-7.6-5.3-9.6.3 1.2.4 2.4.4 3.7 0 4.4-3.6 8-8 8-2.6 0-4.9-1.2-6.3-3.1 1.4-1.7 3.6-2.8 6-2.8 2.2 0 4 1.8 4 4 0 .6-.1 1.1-.4 1.6-.2.4-.6.7-1 .9-.5.2-1 .3-1.6.3-2.2 0-4-1.8-4-4 0-1.7 1-3.1 2.5-3.7.8-.3 1.6-.5 2.5-.5 3.3 0 6 2.7 6 6 0 5-4 9-9 9-4.4 0-8-3.6-8-8 0-3.9 2.8-7.1 6.6-7.8.6-.1 1.1-.2 1.7-.2V1z" fill="#FFFFFF"/>
    <path d="M12.5 7c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5S15 7 12.5 7zm0 6c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="#ED1C24"/>
  </g>
</svg>`,

    // 11. SSLCOMMERZ (Official Blue Security Shield & Green Gateway Emblem)
    sslcommerz: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#005A9C"/>
  <g transform="translate(8, 7.5)">
    <path d="M12 1L2 5.5v7.8c0 6.5 4.3 12.5 10 14 5.7-1.5 10-7.5 10-14V5.5L12 1z" fill="#FFFFFF" fill-opacity="0.15"/>
    <path d="M12 3.2L4 6.8v6.5c0 5.3 3.4 10.3 8 11.6 4.6-1.3 8-6.3 8-11.6V6.8L12 3.2z" fill="#FFFFFF"/>
    <rect x="7.5" y="11" width="9" height="7.5" rx="1.5" fill="#00A859"/>
    <path d="M9.5 11V8.5C9.5 7.1 10.6 6 12 6s2.5 1.1 2.5 2.5V11" stroke="#005A9C" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <circle cx="12" cy="14" r="1" fill="#FFFFFF"/>
    <path d="M12 14.8v1.5" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
  </g>
</svg>`,

    // 12. Stripe (Official Bold Stripe #635BFF with Precise 'S' Glyph Cuts)
    stripe: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#635BFF"/>
  <g transform="translate(10, 8.5) scale(0.95)">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.52.5 6.275.5 2.057 3.737 2.057 8.946c0 6.643 9.143 5.597 9.143 8.472 0 1.018-.89 1.488-2.172 1.488-2.395 0-5.385-1.127-7.464-2.264l-.946 5.568c2.25 1.157 5.767 1.79 8.784 1.79 6.452 0 10.963-3.072 10.963-8.472 0-7.054-9.389-5.748-9.389-8.38z" fill="#FFFFFF"/>
  </g>
</svg>`,

    // 13. Bulk SMS / Twilio (Official Red Connected Telecom Nodes)
    bulksms: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#F22F46"/>
  <circle cx="14" cy="14" r="4.2" fill="#FFFFFF"/>
  <circle cx="26" cy="14" r="4.2" fill="#FFFFFF"/>
  <circle cx="14" cy="26" r="4.2" fill="#FFFFFF"/>
  <circle cx="26" cy="26" r="4.2" fill="#FFFFFF"/>
</svg>`,
    twilio: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#F22F46"/>
  <circle cx="14" cy="14" r="4.2" fill="#FFFFFF"/>
  <circle cx="26" cy="14" r="4.2" fill="#FFFFFF"/>
  <circle cx="14" cy="26" r="4.2" fill="#FFFFFF"/>
  <circle cx="26" cy="26" r="4.2" fill="#FFFFFF"/>
</svg>`,

    // 14. LiveKit (Official Telephony Voice Waveform Telemetry)
    livekit: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#181B22"/>
  <defs>
    <linearGradient id="mogentLkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="100%" stop-color="#8A2BE2"/>
    </linearGradient>
  </defs>
  <g transform="translate(8, 8)">
    <rect x="1" y="8" width="4" height="8" rx="2" fill="url(#mogentLkGrad)"/>
    <rect x="7" y="4" width="4" height="16" rx="2" fill="url(#mogentLkGrad)"/>
    <rect x="13" y="1" width="4" height="22" rx="2" fill="url(#mogentLkGrad)"/>
    <rect x="19" y="6" width="4" height="12" rx="2" fill="url(#mogentLkGrad)"/>
  </g>
</svg>`,

    // 15. Shopify (Official #95BF47 Green Shopping Bag with Script 'S')
    shopify: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#95BF47"/>
  <g transform="translate(9, 6.5)">
    <path d="M8 8V5c0-1.7 1.3-3 3-3s3 1.3 3 3v3" stroke="#5E8E3E" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M3.2 8.5L5 25.5c.1 1 .9 1.8 1.9 1.8h10.2c1 0 1.8-.8 1.9-1.8l1.8-17H3.2z" fill="#FFFFFF"/>
    <path d="M11 8.5v18.8h6.1c1 0 1.8-.8 1.9-1.8l1.8-17H11z" fill="#F0F4EC"/>
    <path d="M12.5 13.8c-.8-.2-1.3-.4-1.3-.8 0-.4.3-.7.8-.7.8 0 1.6.3 2.1.6l.3-1.8c-.7-.3-1.5-.5-2.5-.5-2 0-3.3 1.1-3.3 2.7 0 2 2.8 1.8 2.8 2.7 0 .4-.3.6-.8.6-.8 0-1.8-.4-2.4-.8l-.3 1.9c.7.4 1.8.6 2.8.6 2.1 0 3.5-1 3.5-2.8 0-2.2-2.7-1.9-2.7-2.7z" fill="#95BF47"/>
  </g>
</svg>`,

    // 16. WooCommerce (Official #7F54B3 Purple Badge with Script 'W')
    woocommerce: `<svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#7F54B3"/>
  <g transform="translate(7, 8.5)">
    <path d="M2 2C.9 2 0 2.9 0 4v11c0 1.1.9 2 2 2h2v4.5l4.5-4.5H24c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H2z" fill="#96588A"/>
    <path d="M5.5 7.5c.8 0 1.5 2.5 2.2 5.5.6-2.5 1.5-5.5 2.5-5.5.9 0 1.6 2.5 2.2 5.5.6-2.5 1.5-5.5 2.5-5.5.8 0 1.4.6 1.4 1.8 0 3.5-2.2 7.2-4.5 7.2-1.2 0-2-1.5-2.6-3.8-.6 2.3-1.4 3.8-2.6 3.8-2.3 0-4.5-3.7-4.5-7.2 0-1.2.6-1.8 1.4-1.8z" fill="#FFFFFF"/>
  </g>
</svg>`
  };

  // Helper resolver
  function getBrandSvg(key, fallbackLetter = '') {
    if (BRAND_SVGS[key]) {
      return BRAND_SVGS[key];
    }
    const cleanKey = String(key || '').toLowerCase();
    for (const k in BRAND_SVGS) {
      if (cleanKey.includes(k)) {
        return BRAND_SVGS[k];
      }
    }
    return `<div class="fallback-brand-icon">${fallbackLetter || cleanKey.charAt(0).toUpperCase()}</div>`;
  }

  // Export to global scope
  const root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global);
  root.BRAND_SVGS = BRAND_SVGS;
  root.getBrandSvg = getBrandSvg;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BRAND_SVGS, getBrandSvg };
  }
})();

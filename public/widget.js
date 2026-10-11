/**
 * Mogent AI - Standalone Embeddable Website Chatbot Widget
 * Built with Shadow DOM Isolation & Browser Max Z-Index (2147483647)
 * Zero external dependencies. Works on WordPress, Shopify, and custom HTML.
 */
(function () {
  if (window.__MOGENT_WIDGET_INITIALIZED__) return;
  window.__MOGENT_WIDGET_INITIALIZED__ = true;

  // 1. Identify script configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');

  const tenantSlug =
    currentScript?.getAttribute("data-tenant") || "fashion-hub";

  // Derive API endpoint from script src or default to current origin
  let apiBase = "";
  if (currentScript && currentScript.src) {
    try {
      const url = new URL(currentScript.src);
      apiBase = url.origin;
    } catch (e) {
      apiBase = window.location.origin;
    }
  } else {
    apiBase = window.location.origin;
  }

  // 2. Create Host Container with Browser Max Z-Index
  const hostElement = document.createElement("div");
  hostElement.id = "mogent-ai-widget-root";
  hostElement.style.cssText = `
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    width: auto !important;
    height: auto !important;
    border: none !important;
    background: transparent !important;
    pointer-events: auto !important;
  `;
  document.body.appendChild(hostElement);

  // 3. Attach Shadow DOM for Complete CSS Isolation
  const shadow = hostElement.attachShadow({ mode: "open" });

  // 4. Inject Scoped Styles inside Shadow Root
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
    }

    .widget-launcher {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.4), 0 8px 10px -6px rgba(5, 150, 105, 0.2);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .widget-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 15px 30px -5px rgba(5, 150, 105, 0.5);
    }

    .widget-launcher:active {
      transform: scale(0.95);
    }

    .pulse-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background-color: #ef4444;
      border: 2px solid white;
      border-radius: 50%;
    }

    .chat-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 375px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 120px);
      background-color: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.95);
    }

    .chat-window.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    .chat-header {
      background: linear-gradient(135deg, #064e3b 0%, #059669 100%);
      color: white;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    }

    .title {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.2;
    }

    .status-text {
      font-size: 11px;
      color: #a7f3d0;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      background-color: #10b981;
      border-radius: 50%;
      display: inline-block;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .msg {
      max-width: 82%;
      font-size: 13px;
      line-height: 1.5;
      padding: 10px 14px;
      border-radius: 18px;
      word-break: break-word;
      white-space: pre-line;
    }

    .msg-bot {
      align-self: flex-start;
      background-color: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .msg-user {
      align-self: flex-end;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #a7f3d0;
    }

    .order-card {
      margin-top: 8px;
      padding: 10px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 12px;
      font-size: 11px;
    }

    .order-card-title {
      font-weight: bold;
      color: #166534;
      margin-bottom: 4px;
      border-bottom: 1px dashed #bbf7d0;
      padding-bottom: 4px;
    }

    .typing-dots {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: bounce 1.2s infinite ease-in-out;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }

    .input-area {
      padding: 12px;
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 10px 14px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }

    .chat-input:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .send-btn {
      width: 38px;
      height: 38px;
      background: #059669;
      border: none;
      border-radius: 12px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .send-btn:hover {
      background: #047857;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .powered-by {
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      padding-bottom: 6px;
      background: #ffffff;
    }

    .powered-by a {
      color: #059669;
      text-decoration: none;
      font-weight: 600;
    }
  `;
  shadow.appendChild(style);

  // 5. Build Widget DOM
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <!-- Launcher Button -->
    <button class="widget-launcher" id="mogent-launcher" title="Chat with AI Assistant">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
      <span class="pulse-badge"></span>
    </button>

    <!-- Chat Modal Window -->
    <div class="chat-window" id="mogent-window">
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="avatar" id="mogent-avatar">M</div>
          <div>
            <div class="title" id="mogent-title">Mogent AI Store</div>
            <div class="status-text">
              <span class="status-dot"></span>
              <span>Active Assistant</span>
            </div>
          </div>
        </div>
        <button class="close-btn" id="mogent-close" title="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="messages-container" id="mogent-messages">
        <div class="msg msg-bot">
          স্বাগতম! আমি কীভাবে আপনাকে সাহায্য করতে পারি? পণ্য সম্পর্কে জানতে বা অর্ডার করতে আমাকে মেসেজ দিন।
        </div>
      </div>

      <div class="input-area">
        <input type="text" class="chat-input" id="mogent-input" placeholder="আপনার প্রশ্ন বা বার্তা লিখুন..." />
        <button class="send-btn" id="mogent-send" title="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="powered-by">
        Powered by <a href="${apiBase}" target="_blank">Mogent AI</a>
      </div>
    </div>
  `;
  shadow.appendChild(wrapper);

  // 6. Bind Widget Interactions
  const launcher = shadow.getElementById("mogent-launcher");
  const chatWindow = shadow.getElementById("mogent-window");
  const closeBtn = shadow.getElementById("mogent-close");
  const messagesContainer = shadow.getElementById("mogent-messages");
  const input = shadow.getElementById("mogent-input");
  const sendBtn = shadow.getElementById("mogent-send");
  const titleEl = shadow.getElementById("mogent-title");
  const avatarEl = shadow.getElementById("mogent-avatar");

  let isOpen = false;

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.classList.add("open");
      launcher.style.transform = "scale(0.9)";
      input.focus();
    } else {
      chatWindow.classList.remove("open");
      launcher.style.transform = "scale(1)";
    }
  }

  launcher.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  function appendMessage(text, isUser = false, verifiedStock = false, orderSummary = null) {
    const msgEl = document.createElement("div");
    msgEl.className = `msg ${isUser ? "msg-user" : "msg-bot"}`;
    msgEl.textContent = text;

    if (verifiedStock) {
      const badge = document.createElement("div");
      badge.className = "verified-badge";
      badge.innerHTML = `✓ Verified Stock`;
      msgEl.appendChild(badge);
    }

    if (orderSummary) {
      const orderCard = document.createElement("div");
      orderCard.className = "order-card";
      orderCard.innerHTML = `
        <div class="order-card-title">অর্ডার নিশ্চিতকরণ (${orderSummary.orderNumber || "New"})</div>
        <div>পণ্য: <strong>${orderSummary.productName}</strong></div>
        <div>মোট: <strong>৳${orderSummary.totalAmount}</strong> (ডেলিভারি: ৳${orderSummary.deliveryCharge})</div>
      `;
      msgEl.appendChild(orderCard);
    }

    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.id = "mogent-typing";
    typing.className = "typing-dots";
    typing.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = shadow.getElementById("mogent-typing");
    if (typing) typing.remove();
  }

  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    appendMessage(text, true);
    showTypingIndicator();
    sendBtn.disabled = true;

    try {
      const res = await fetch(`${apiBase}/api/v1/widget/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: tenantSlug,
          message: text,
        }),
      });

      removeTypingIndicator();
      sendBtn.disabled = false;

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.storeName && titleEl) {
          titleEl.textContent = data.storeName;
          avatarEl.textContent = data.storeName.charAt(0);
        }
        appendMessage(data.replyText, false, data.verifiedStock, data.orderSummary);
      } else {
        appendMessage(data.error || "দুঃখিত, সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।", false);
      }
    } catch (err) {
      removeTypingIndicator();
      sendBtn.disabled = false;
      appendMessage("সার্ভারে সাময়িক সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।", false);
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
})();

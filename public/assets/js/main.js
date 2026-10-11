function initAllMogent() {
  initScrollProgressBar();
  initHeroSimulator();
  initHeroTrainerConsole();
  initRoiCalculator();
  initPricingToggle();
  initFeatureTabs();
  initFaqAccordion();
  initVoiceSamplePlayer();
  initMobileMenu();
  initFloatingDock();
  initCopyTriggers();
  initLiveOrderToast();
  initVoiceCallSimulation();
  initInteractiveCourierTracker();
  initTiltEffect();
}

if (typeof window !== 'undefined') {
  window.initMogentLanding = initAllMogent;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllMogent);
  } else {
    setTimeout(initAllMogent, 50);
  }
}

// ==========================================
// 1. Scroll Progress Bar
// ==========================================
function initScrollProgressBar() {
  const bar = document.getElementById('scrollProgressBar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

// ==========================================
// 2. Toast Notification System
// ==========================================
function showToast(message) {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    document.body.appendChild(box);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `
    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
    <span>${message}</span>
  `;
  box.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

// ==========================================
// 3. Copy-to-Clipboard Triggers
// ==========================================
function initCopyTriggers() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.copy-trigger');
    if (!trigger) return;

    const textToCopy = trigger.dataset.copyText || trigger.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`কপি হয়েছে: ${textToCopy}`);
      }).catch(() => {
        showToast('কপি করা যায়নি');
      });
    } else {
      showToast(`কপি হয়েছে: ${textToCopy}`);
    }
  });
}

// ==========================================
// 4. Hero Live Phone Simulator & Scenarios (Continuous Autoplay)
// ==========================================
const chatScenarios = {
  jamdani: [
    {
      sender: 'user',
      text: 'আসসালামু আলাইকুম ভাইয়া, নীল জামদানি শাড়িটা কি স্টকে আছে? প্রাইস কত পড়বে?',
      delay: 500
    },
    {
      sender: 'ai',
      text: 'ওয়ালাইকুম আসসালাম আপু! জ্বী, রয়্যাল ব্লু জামদানিটা রেডি স্টকে আছে। একদম পিওর কটন হ্যান্ডলুম, সাথে ব্লাউজ পিস পাবেন।\n\nপ্রাইস মাত্র ৫,৫০০ টাকা। ঢাকার ভেতরে ডেলিভারি চার্জ ৭০ টাকা (২৪-৪৮ ঘণ্টায় পাবেন), বাইরে ১৫০ টাকা। ক্যাশ অন ডেলিভারিতে পার্সেল খুলে চেক করে নিতে পারবেন।',
      product: {
        title: 'রয়্যাল ব্লু পিওর হ্যান্ডলুম ঢাকাই জামদানি (৮৪ কাউন্ট)',
        price: '৳ ৫,৫০০',
        badge: 'ইন স্টক • বেস্টসেলার',
        img: 'assets/images/jamdani_saree.jpg'
      },
      delay: 1300
    },
    {
      sender: 'user',
      text: 'শাড়িটা অনেক সুন্দর! আমি ১ পিস কনফার্ম করছি।\nসানজিদা রহমান, বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা। ফোন: ০১৭১১২২৩৩৪৪',
      delay: 1800
    },
    {
      sender: 'ai',
      text: 'অসংখ্য ধন্যবাদ সানজিদা আপু! আপনার অর্ডারটি সাথে সাথে প্লেস করা হয়েছে।\n\nঅর্ডার কোড: #MG-8942\nSteadfast কুরিয়ারে বুকিং সম্পন্ন। পার্সেল ডেলিভারি ম্যানের হাতে যেতেই ফোনে ট্র্যাকিং এসএমএস পাবেন।',
      callAlert: 'অর্ডার ভেরিফিকেশনের জন্য Mogent AI কাস্টমারকে স্বয়ংক্রিয় ফোন কল করছে...',
      delay: 1600
    }
  ],
  tshirt: [
    {
      sender: 'user',
      text: 'ভাইয়া, হেভিওয়েট ব্ল্যাক টি-শার্টের L সাইজ হবে? বিকাশে নাকি ক্যাশ অনে নেওয়া যাবে?',
      delay: 500
    },
    {
      sender: 'ai',
      text: 'জ্বী ভাইয়া, ব্ল্যাক কালার L সাইজ একদম এভেইলেবল! ২২০ জিএসএম পিওর কম্বড কটন, কালার বা ফেব্রিকে কোনো সমস্যা হবে না ইনশাআল্লাহ।\n\nক্যাশ অন ডেলিভারি বা বিকাশ—যেভাবে সুবিধা নিতে পারবেন। বিকাশ মার্চেন্টে পে করলে সরাসরি ১০% ক্যাশব্যাক পাবেন।',
      product: {
        title: 'কম্বড কটন ওভারসাইজড ড্রপশোল্ডার টি-শার্ট',
        price: '৳ ৮৫০',
        badge: 'স্টকে মাত্র ৫টি বাকি',
        img: 'assets/images/black_tshirt.jpg'
      },
      delay: 1300
    },
    {
      sender: 'user',
      text: 'ঠিক আছে ভাইয়া, ১ পিস পাঠিয়ে দেন।\nতানভীর হাসান, ফ্ল্যাট ৪/বি, মিরপুর-১০, ঢাকা। মোবাইল: ০১৮৯৯১১২২৩৩',
      delay: 1800
    },
    {
      sender: 'ai',
      text: 'অর্ডার একদম কনফার্ম ভাইয়া!\n\nঅর্ডার কোড: #MG-9031\nPathao Logistics-এ পার্সেল বুক করা হয়েছে। ট্র্যাকিং কোড #PT-7719। কালকের মধ্যেই ইনশাআল্লাহ ডেলিভারি পেয়ে যাবেন।',
      callAlert: 'Pathao কুরিয়ার সিঙ্ক সম্পন্ন, স্বয়ংক্রিয় ভয়েস কল ভেরিফিকেশন চলছে...',
      delay: 1600
    }
  ]
};

let activeScenarioKey = 'jamdani';
let chatTimer = null;
let isChatPaused = false;
let messageIndex = 0;

function initHeroSimulator() {
  const chatContainer = document.getElementById('phoneChatContainer');
  const scenarioButtons = document.querySelectorAll('.scenario-toggle-btn');
  const pauseButton = document.getElementById('chatPauseBtn');
  const restartButton = document.getElementById('chatRestartBtn');

  if (!chatContainer) return;

  function updateScenarioButtons() {
    scenarioButtons.forEach(btn => {
      if (btn.dataset.scenario === activeScenarioKey) {
        btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-xs');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-xs');
        btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
      }
    });
  }

  function startScenario() {
    clearTimeout(chatTimer);
    chatContainer.innerHTML = '';
    messageIndex = 0;
    processNextMessage();
  }

  function processNextMessage() {
    if (isChatPaused) return;

    const list = chatScenarios[activeScenarioKey];
    if (messageIndex >= list.length) {
      chatTimer = setTimeout(() => {
        // Continuous automated loop: switch to next scenario
        activeScenarioKey = activeScenarioKey === 'jamdani' ? 'tshirt' : 'jamdani';
        updateScenarioButtons();
        startScenario();
      }, 4500);
      return;
    }

    const item = list[messageIndex];
    const typingBubble = document.getElementById('phoneTypingBubble');

    if (item.sender === 'ai') {
      if (typingBubble) typingBubble.classList.remove('hidden');
      chatContainer.scrollTop = chatContainer.scrollHeight;

      chatTimer = setTimeout(() => {
        if (typingBubble) typingBubble.classList.add('hidden');
        renderBubble(item);
        messageIndex++;

        // Update live laptop dashboard metric
        const dashboardOrderCount = document.getElementById('laptopOrderCount');
        const dashboardRevenue = document.getElementById('laptopRevenue');
        if (item.product && dashboardOrderCount && dashboardRevenue) {
          const currentCount = parseInt(dashboardOrderCount.textContent.replace(/[^\d]/g, '') || '42', 10);
          dashboardOrderCount.textContent = (currentCount + 1).toLocaleString('bn-BD') + ' টি';
          dashboardRevenue.textContent = '৳ ' + (68500 + (messageIndex * 3000)).toLocaleString('bn-BD');
        }

        chatTimer = setTimeout(processNextMessage, 1100);
      }, item.delay);
    } else {
      renderBubble(item);
      messageIndex++;
      chatTimer = setTimeout(processNextMessage, 1200);
    }
  }

  // Toggle scenario buttons
  scenarioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeScenarioKey = btn.dataset.scenario;
      updateScenarioButtons();
      startScenario();
    });
  });

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      isChatPaused = !isChatPaused;
      pauseButton.innerHTML = isChatPaused
        ? `<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        : `<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      if (!isChatPaused) processNextMessage();
    });
  }

  if (restartButton) {
    restartButton.addEventListener('click', () => {
      isChatPaused = false;
      if (pauseButton) {
        pauseButton.innerHTML = `<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      }
      startScenario();
    });
  }

  startScenario();
}

function renderBubble(item) {
  const chatContainer = document.getElementById('phoneChatContainer');
  if (!chatContainer) return;

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = `flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'} mb-3 transition-all duration-300 opacity-0 translate-y-2`;

  let html = '';

  if (item.sender === 'user') {
    html = `
      <div class="max-w-[85%] bg-indigo-600 text-white text-xs sm:text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-xs shadow-sm font-body leading-relaxed">
        ${item.text}
      </div>
      <span class="text-[10px] text-slate-400 mt-1 mr-1">কাস্টমার • এইমাত্র</span>
    `;
  } else {
    html = `
      <div class="flex items-start gap-2 max-w-[92%]">
        <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
          M
        </div>
        <div class="flex flex-col">
          <div class="bg-white border border-slate-200 text-slate-800 text-xs sm:text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-sm font-body whitespace-pre-line leading-relaxed">
            ${item.text}
          </div>

          ${item.product ? `
            <div class="mt-2.5 bg-slate-50 border border-indigo-100 rounded-xl p-2.5 flex items-center gap-3 shadow-xs">
              <img src="${item.product.img}" alt="Product" class="w-13 h-13 object-cover rounded-lg shrink-0 border border-slate-200" />
              <div class="flex-1 min-w-0">
                <span class="inline-block text-[9px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mb-0.5">${item.product.badge}</span>
                <p class="text-xs font-bold text-slate-900 truncate font-body">${item.product.title}</p>
                <p class="text-xs text-indigo-600 font-extrabold mt-0.5">${item.product.price}</p>
              </div>
            </div>
          ` : ''}

          ${item.callAlert ? `
            <div class="mt-2 bg-indigo-50 border border-indigo-200 rounded-xl p-2 flex items-center justify-between gap-2 text-[11px] text-indigo-900 font-medium">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0"></span>
                <span>${item.callAlert}</span>
              </div>
              <button class="trigger-voice-call shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-colors shadow-xs flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span>কল টেস্ট</span>
              </button>
            </div>
          ` : ''}

          <span class="text-[10px] text-slate-400 mt-1 ml-1">Mogent AI • ৩ সেকেন্ডে উত্তর</span>
        </div>
      </div>
    `;
  }

  bubbleWrapper.innerHTML = html;
  chatContainer.appendChild(bubbleWrapper);

  requestAnimationFrame(() => {
    bubbleWrapper.classList.remove('opacity-0', 'translate-y-2');
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

// Global Living Memory State (Synced between Merchant Trainer and Customer Chat)
window.livingMemory = {
  delivery: 'ঢাকা ৳৭০, বাইরে ৳১৫০',
  bkash: '০১৭১১২২৩৩৪৪ (১০% ছাড়)',
  returnPolicy: '১০ দিনের রিটার্ন গ্যারান্টি',
  offer: 'যেকোনো ২ পিসে সারা দেশে ফ্রি ডেলিভারি'
};

function generateAiReply(query) {
  const q = query.toLowerCase();

  if (q.includes('চার্জ') || q.includes('ডেলিভারি')) {
    return {
      sender: 'ai',
      text: `আমাদের ডেলিভারি পলিসি:\n${window.livingMemory.delivery}\n(মার্চেন্ট চ্যাট ট্রেইনার থেকে সরাসরি সিঙ্কড)`
    };
  } else if (q.includes('বিকাশ') || q.includes('পেমেন্ট') || q.includes('নম্বর')) {
    return {
      sender: 'ai',
      text: `আমাদের অফিসিয়াল মার্চেন্ট পেমেন্ট:\nbKash: ${window.livingMemory.bkash}\nক্যাশ অন ডেলিভারি (COD): সারা দেশে প্রযোজ্য!`
    };
  } else if (q.includes('অর্ডার') || q.includes('কনফার্ম') || q.includes('বুক')) {
    return {
      sender: 'ai',
      text: 'অর্ডার সফলভাবে বুক করা হয়েছে!\n\nঅর্ডার আইডি: #MG-' + Math.floor(1000 + Math.random() * 9000) + '\nSteadfast কুরিয়ার কনসাইনমেন্ট জেনারেট হয়েছে।',
      callAlert: 'মানুষের কণ্ঠে স্বয়ংক্রিয় এআই ভয়েস কল ভেরিফিকেশন শুরু হচ্ছে...'
    };
  } else if (q.includes('রিটার্ন') || q.includes('চেঞ্জ') || q.includes('ওয়ারেন্টি')) {
    return {
      sender: 'ai',
      text: `আমাদের স্টোর পলিসি অনুযায়ী:\n${window.livingMemory.returnPolicy} এবং ডেলিভারির সময় চেক করে নেওয়া যাবে!`
    };
  } else {
    return {
      sender: 'ai',
      text: `জ্বী অবশ্যই! আপনার প্রশ্নের উত্তর আমাদের স্টোর লিভিং নোটবুক থেকে তাৎক্ষণিকভাবে ভেরিফাই করা হয়েছে। আমাদের বর্তমান অফার: ${window.livingMemory.offer}। আপনি কি কোনো নির্দিষ্ট প্রোডাক্ট অর্ডার করতে চান?`
    };
  }
}

// ==========================================
// 6. Web Audio API Phone Call Chime Synthesizer
// ==========================================
function playIncomingCallChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    function playTone(freq1, freq2, startTime, duration) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, startTime);
      osc2.frequency.setValueAtTime(freq2, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    }

    const now = ctx.currentTime;
    // Classic dual-tone European/BD telephone ring
    playTone(440, 480, now, 0.5);
    playTone(440, 480, now + 0.6, 0.5);
    playTone(523, 659, now + 1.3, 0.7); // Pleasant confirm chime
  } catch (err) {
    console.log('AudioContext allowed after user interaction');
  }
}

function initVoiceSamplePlayer() {
  const playBtn = document.getElementById('bentoPlayAudioBtn');
  const waveBox = document.getElementById('bentoSoundwaveBox');
  const caption = document.getElementById('bentoVoiceCaption');
  let isPlaying = false;
  let voiceTimer = null;

  if (!playBtn) return;

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      playIncomingCallChime();
      waveBox.classList.remove('opacity-30');
      waveBox.classList.add('opacity-100');
      playBtn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      caption.textContent = 'শুনছেন: "আসসালামু আলাইকুম, আমি Mogent AI থেকে আপনার জামদানি শাড়ির অর্ডারটি নিশ্চিত করতে কল করেছি..."';
      showToast('লাইভ ভয়েস কল টেস্ট হচ্ছে...');

      clearTimeout(voiceTimer);
      voiceTimer = setTimeout(() => {
        isPlaying = false;
        waveBox.classList.add('opacity-30');
        waveBox.classList.remove('opacity-100');
        playBtn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>`;
        caption.textContent = 'অর্ডার ভেরিফিকেশন ভয়েস কলের নমুনা শুনুন (ক্লিক করুন)';
      }, 7000);
    } else {
      clearTimeout(voiceTimer);
      waveBox.classList.add('opacity-30');
      waveBox.classList.remove('opacity-100');
      playBtn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>`;
      caption.textContent = 'অর্ডার ভেরিফিকেশন ভয়েস কলের নমুনা শুনুন (ক্লিক করুন)';
    }
  });
}

// ==========================================
// 7. Interactive ROI Calculator with Counting Animation
// ==========================================
function initRoiCalculator() {
  const slider = document.getElementById('calcSlider');
  const countLabel = document.getElementById('calcMessageCount');
  const staffOutput = document.getElementById('calcStaffCount');
  const salaryOutput = document.getElementById('calcStaffSalary');
  const mogentCostOutput = document.getElementById('calcMogentCost');
  const savingsOutput = document.getElementById('calcNetSavings');
  const boostOutput = document.getElementById('calcSalesBoost');

  if (!slider) return;

  function update() {
    const msgs = parseInt(slider.value, 10);
    countLabel.textContent = msgs.toLocaleString('bn-BD');

    const staff = Math.max(1, Math.ceil(msgs / 35));
    staffOutput.textContent = staff.toLocaleString('bn-BD');

    const salary = staff * 15000;
    salaryOutput.textContent = '৳ ' + salary.toLocaleString('bn-BD');

    const paygCost = Math.round(msgs * 30 * 0.25);
    const mogentTotal = 1999 + paygCost;
    mogentCostOutput.textContent = '৳ ' + mogentTotal.toLocaleString('bn-BD');

    const netSavings = Math.max(0, salary - mogentTotal);
    savingsOutput.textContent = '৳ ' + netSavings.toLocaleString('bn-BD');

    const boost = Math.min(65, 30 + Math.round(msgs * 0.05));
    boostOutput.textContent = `+${boost.toLocaleString('bn-BD')}%`;
  }

  slider.addEventListener('input', update);
  update();
}

// ==========================================
// 9. Pricing Billing Period Toggle
// ==========================================
function initPricingToggle() {
  const toggle = document.getElementById('billingSwitch');
  const priceStarter = document.getElementById('priceValStarter');
  const priceGrowth = document.getElementById('priceValGrowth');
  const priceEnterprise = document.getElementById('priceValEnterprise');
  const labelSub = document.querySelectorAll('.billing-note');

  if (!toggle) return;

  toggle.addEventListener('change', () => {
    const isYearly = toggle.checked;

    if (isYearly) {
      if (priceStarter) priceStarter.textContent = '৳ ৭৯৯';
      if (priceGrowth) priceGrowth.textContent = '৳ ১,৫৯৯';
      if (priceEnterprise) priceEnterprise.textContent = '৳ ৩,৯৯৯';
      labelSub.forEach(el => el.textContent = '/মাস (বাৎসরিক বিলে ২০% ছাড়)');
      showToast('বাৎসরিক বিলে ২০% ছাড় চালু হয়েছে');
    } else {
      if (priceStarter) priceStarter.textContent = '৳ ৯৯৯';
      if (priceGrowth) priceGrowth.textContent = '৳ ১,৯৯৯';
      if (priceEnterprise) priceEnterprise.textContent = '৳ ৪,৯৯৯';
      labelSub.forEach(el => el.textContent = '/মাস (প্রতি মাসে বিলিং)');
    }
  });
}

// ==========================================
// 10. 7 Feature Categories Tabs Switcher
// ==========================================
function initFeatureTabs() {
  const tabBtns = document.querySelectorAll('.feature-pill-btn');
  const tabCards = document.querySelectorAll('.feature-detail-card');

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.tab;

      tabBtns.forEach(b => {
        b.classList.remove('bg-indigo-600', 'text-white', 'shadow-xs');
        b.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
      });

      btn.classList.add('bg-indigo-600', 'text-white', 'shadow-xs');
      btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');

      tabCards.forEach(card => {
        if (card.id === `featureCard-${idx}`) {
          card.classList.remove('hidden');
          card.classList.add('grid');
        } else {
          card.classList.add('hidden');
          card.classList.remove('grid');
        }
      });
    });
  });
}

// ==========================================
// 11. Interactive FAQ Accordion
// ==========================================
function initFaqAccordion() {
  const faqRows = document.querySelectorAll('.clean-faq-row');

  faqRows.forEach(row => {
    const trigger = row.querySelector('.faq-toggle-bar');
    const answer = row.querySelector('.faq-answer-panel');
    const arrow = row.querySelector('.faq-arrow-icon');

    if (!trigger || !answer) return;

    trigger.addEventListener('click', () => {
      const isVisible = !answer.classList.contains('hidden');

      faqRows.forEach(otherRow => {
        const otherAns = otherRow.querySelector('.faq-answer-panel');
        const otherArr = otherRow.querySelector('.faq-arrow-icon');
        if (otherAns) otherAns.classList.add('hidden');
        if (otherArr) otherArr.style.transform = 'rotate(0deg)';
      });

      if (!isVisible) {
        answer.classList.remove('hidden');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// ==========================================
// 12. Floating Quick Action Dock
// ==========================================
function initFloatingDock() {
  const dock = document.getElementById('floatingDock');
  if (!dock) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      dock.classList.add('dock-visible');
    } else {
      dock.classList.remove('dock-visible');
    }
  }, { passive: true });

  const scrollTopBtn = document.getElementById('dockScrollTopBtn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ==========================================
// 13. Mobile Navigation Drawer
// ==========================================
function initMobileMenu() {
  const openBtn = document.getElementById('mobileNavOpenBtn');
  const closeBtn = document.getElementById('mobileNavCloseBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const links = document.querySelectorAll('.mobile-link-item');

  if (!openBtn || !drawer) return;

  function open() {
    drawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.add('hidden');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  links.forEach(l => l.addEventListener('click', close));
}

// ==========================================
// 14. Live Order Social Proof Notification Pill
// ==========================================
function initLiveOrderToast() {
  const toast = document.getElementById('liveOrderToast');
  if (!toast) return;

  const orders = [
    {
      avatar: 'সা',
      bgColor: 'bg-indigo-600',
      name: 'সানজিদা রহমান (ধানমন্ডি)',
      item: 'ঢাকাই জামদানি শাড়ি (৳৫,৫০০)',
      courier: 'Steadfast বুকড',
      time: '১ মিনিট আগে'
    },
    {
      avatar: 'তা',
      bgColor: 'bg-emerald-600',
      name: 'তানভীর হাসান (মিরপুর-১০)',
      item: 'ওভারসাইজড টি-শার্ট (৳৮৫০)',
      courier: 'Pathao বুকড',
      time: '৩ মিনিট আগে'
    },
    {
      avatar: 'রো',
      bgColor: 'bg-purple-600',
      name: 'রোকসানা পারভীন (উত্তরা)',
      item: 'সিল্ক পার্টি থ্রি-পিস (৳৪,২০০)',
      courier: 'Steadfast বুকড',
      time: '৫ মিনিট আগে'
    },
    {
      avatar: 'মা',
      bgColor: 'bg-blue-600',
      name: 'মাহবুব আলম (চট্টগ্রাম)',
      item: 'লেদার ওয়ালেট সেট (৳১,২৫০)',
      courier: 'Steadfast বুকড',
      time: '৮ মিনিট আগে'
    }
  ];

  let orderIndex = 0;
  const avatarEl = document.getElementById('lotAvatar');
  const nameEl = document.getElementById('lotName');
  const itemEl = document.getElementById('lotItem');
  const courierEl = document.getElementById('lotCourier');
  const timeEl = document.getElementById('lotTime');
  const closeBtn = document.getElementById('lotCloseBtn');

  let isDismissed = false;
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      isDismissed = true;
      toast.classList.remove('toast-visible');
    });
  }

  function showNextOrder() {
    if (isDismissed) return;
    const order = orders[orderIndex];

    if (avatarEl) {
      avatarEl.textContent = order.avatar;
      avatarEl.className = `w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-sm ${order.bgColor}`;
    }
    if (nameEl) nameEl.textContent = order.name;
    if (itemEl) itemEl.textContent = order.item;
    if (courierEl) courierEl.textContent = order.courier;
    if (timeEl) timeEl.textContent = order.time;

    toast.classList.add('toast-visible');

    setTimeout(() => {
      if (!isDismissed) {
        toast.classList.remove('toast-visible');
      }
    }, 5500);

    orderIndex = (orderIndex + 1) % orders.length;
  }

  // Start after 2.5 seconds, repeats every 14 seconds
  setTimeout(() => {
    showNextOrder();
    setInterval(showNextOrder, 14000);
  }, 2500);
}

// ==========================================
// 15. Interactive Voice Call Simulation Modal
// ==========================================
function initVoiceCallSimulation() {
  const modal = document.getElementById('voiceCallModal');
  const triggerBtns = document.querySelectorAll('.trigger-voice-call');
  const closeBtn = document.getElementById('vcCloseBtn');
  const answerBtn = document.getElementById('vcAnswerBtn');
  const declineBtn = document.getElementById('vcDeclineBtn');
  const callStatus = document.getElementById('vcCallStatus');
  const callTimerEl = document.getElementById('vcCallTimer');
  const incomingControls = document.getElementById('vcIncomingControls');
  const activeControls = document.getElementById('vcActiveControls');
  const transcriptBox = document.getElementById('vcTranscriptBox');
  const waveBox = document.getElementById('vcWaveBox');
  const btnConfirmOrder = document.getElementById('vcConfirmOrderBtn');
  const btnCancelOrder = document.getElementById('vcCancelOrderBtn');
  const endCallBtn = document.getElementById('vcEndCallBtn');

  if (!modal) return;

  let callTimerInterval = null;
  let callSeconds = 0;
  let ringInterval = null;

  function playRingtone() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.2);
      osc2.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      // AudioContext fallback
    }
  }

  function startRinging() {
    playRingtone();
    ringInterval = setInterval(playRingtone, 2500);
  }

  function stopRinging() {
    if (ringInterval) {
      clearInterval(ringInterval);
      ringInterval = null;
    }
  }

  function openCallModal() {
    modal.classList.add('modal-open');
    callSeconds = 0;
    if (callTimerEl) callTimerEl.textContent = '00:00';
    if (callStatus) callStatus.textContent = 'ইনকামিং এআই কল...';
    if (incomingControls) incomingControls.classList.remove('hidden');
    if (activeControls) activeControls.classList.add('hidden');
    if (waveBox) waveBox.classList.add('hidden');
    if (transcriptBox) {
      transcriptBox.classList.add('hidden');
      transcriptBox.innerHTML = '';
    }
    startRinging();
  }

  function closeCallModal() {
    stopRinging();
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }
    modal.classList.remove('modal-open');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'bn-BD';
    utt.rate = 0.92;
    utt.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(v => v.lang.startsWith('bn') || v.name.includes('Bangla') || v.name.includes('Bengali'));
    if (bnVoice) utt.voice = bnVoice;
    window.speechSynthesis.speak(utt);
  }

  function answerCall() {
    stopRinging();
    if (incomingControls) incomingControls.classList.add('hidden');
    if (activeControls) activeControls.classList.remove('hidden');
    if (waveBox) waveBox.classList.remove('hidden');
    if (callStatus) callStatus.textContent = 'কল চলমান • Mogent AI Sales Agent';

    callTimerInterval = setInterval(() => {
      callSeconds++;
      const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const secs = String(callSeconds % 60).padStart(2, '0');
      if (callTimerEl) callTimerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    const initialSpeech = "আসসালামু আলাইকুম সানজিদা আপু! আমি Mogent AI থেকে আপনার জামদানি শাড়ির ক্যাশ অন ডেলিভারি অর্ডারটি নিশ্চিত করতে কল করেছি। আপনি কি অর্ডারটি কনফার্ম করছেন?";
    speakText(initialSpeech);

    if (transcriptBox) {
      transcriptBox.classList.remove('hidden');
      transcriptBox.innerHTML = `
        <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 font-bengali leading-relaxed animate-fade-in">
          <span class="font-bold text-indigo-700 flex items-center gap-1.5 mb-1">
            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Mogent AI:</span>
          </span>
          "${initialSpeech}"
        </div>
      `;
    }
  }

  if (answerBtn) answerBtn.addEventListener('click', answerCall);
  if (declineBtn) declineBtn.addEventListener('click', closeCallModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCallModal);
  if (endCallBtn) endCallBtn.addEventListener('click', closeCallModal);

  if (btnConfirmOrder) {
    btnConfirmOrder.addEventListener('click', () => {
      const confirmSpeech = "অসংখ্য ধন্যবাদ সানজিদা আপু! আপনার অর্ডার আইডি #MG-8942 কনফার্ম করে Steadfast কুরিয়ারে বুক করা হলো। ট্র্যাকিং কোড মোবাইলে পাঠানো হয়েছে। ভালো থাকবেন!";
      speakText(confirmSpeech);

      if (transcriptBox) {
        transcriptBox.innerHTML += `
          <div class="bg-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-bengali text-right my-2">
            <span class="font-bold text-slate-600 flex items-center justify-end gap-1.5 mb-0.5">
              <span>আপনি (কাস্টমার):</span>
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </span>
            "হ্যাঁ, অর্ডার কনফার্ম করে দিন।"
          </div>
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 font-bengali leading-relaxed mt-2">
            <span class="font-bold text-emerald-700 flex items-center gap-1.5 mb-1">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Mogent AI:</span>
            </span>
            "${confirmSpeech}"
          </div>
        `;
      }

      showToast('অর্ডার সফলভাবে ভেরিফাইড ও Steadfast কুরিয়ারে বুকড!');

      setTimeout(() => {
        closeCallModal();
      }, 4500);
    });
  }

  if (btnCancelOrder) {
    btnCancelOrder.addEventListener('click', () => {
      const cancelSpeech = "ঠিক আছে আপু, আপনার অনুরোধ অনুযায়ী অর্ডারটি সাথে সাথে বাতিল করা হলো। কোনো ডেলিভারি চার্জ কাটা যাবে না। ধন্যবাদ!";
      speakText(cancelSpeech);

      if (transcriptBox) {
        transcriptBox.innerHTML += `
          <div class="bg-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-bengali text-right my-2">
            <span class="font-bold text-slate-600 flex items-center justify-end gap-1.5 mb-0.5">
              <span>আপনি (কাস্টমার):</span>
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </span>
            "না, আমি অর্ডার ক্যান্সেল করতে চাই।"
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-bengali leading-relaxed mt-2">
            <span class="font-bold text-amber-700 flex items-center gap-1.5 mb-1">
              <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              <span>Mogent AI:</span>
            </span>
            "${cancelSpeech}"
          </div>
        `;
      }

      showToast('ফেক অর্ডার ফিল্টার ডান: পার্সেল বাতিল হলো (৳০ খরচ)');

      setTimeout(() => {
        closeCallModal();
      }, 4000);
    });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.trigger-voice-call');
    if (!trigger) return;
    e.preventDefault();
    openCallModal();
  });
}

// ==========================================
// 16. Interactive Courier Status Tracker Simulator
// ==========================================
function initInteractiveCourierTracker() {
  const trackBtn = document.getElementById('courierTrackBtn');
  const trackInput = document.getElementById('courierTrackInput');
  const trackResult = document.getElementById('courierTrackResult');
  const trackCodeDisplay = document.getElementById('courierTrackCodeDisplay');

  if (!trackBtn || !trackInput || !trackResult) return;

  trackBtn.addEventListener('click', () => {
    const code = trackInput.value.trim() || 'SF-4019';
    if (trackCodeDisplay) trackCodeDisplay.textContent = code;

    trackResult.classList.remove('hidden');
    trackResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast(`কুরিয়ার ট্র্যাকিং লোড হয়েছে: ${code}`);
  });
}

// ==========================================
// 17. 3D Card Tilt Micro-Interaction
// ==========================================
function initTiltEffect() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

// ==========================================
// 18. Sound Chime Helper for Living Memory Updates
// ==========================================
function playMemoryUpdateChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    // AudioContext fallback
  }
}

// ==========================================
// 19. Hero 100% Chat-Driven AI Trainer Console (Continuous Automated Learning Loop)
// ==========================================
function initHeroTrainerConsole() {
  const tabTrainer = document.getElementById('heroTabTrainerBtn');
  const tabDashboard = document.getElementById('heroTabDashboardBtn');
  const viewTrainer = document.getElementById('heroViewTrainer');
  const viewDashboard = document.getElementById('heroViewDashboard');

  if (tabTrainer && tabDashboard && viewTrainer && viewDashboard) {
    tabTrainer.addEventListener('click', () => {
      tabTrainer.className = 'px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold transition-all shadow-xs flex items-center gap-1.5';
      tabDashboard.className = 'px-3.5 py-1.5 rounded-xl bg-white text-slate-600 font-medium hover:text-slate-900 border border-slate-200 transition-all flex items-center gap-1.5';
      viewTrainer.classList.remove('hidden');
      viewDashboard.classList.add('hidden');
    });

    tabDashboard.addEventListener('click', () => {
      tabDashboard.className = 'px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold transition-all shadow-xs flex items-center gap-1.5';
      tabTrainer.className = 'px-3.5 py-1.5 rounded-xl bg-white text-slate-600 font-medium hover:text-slate-900 border border-slate-200 transition-all flex items-center gap-1.5';
      viewDashboard.classList.remove('hidden');
      viewTrainer.classList.add('hidden');
    });
  }

  const chatStream = document.getElementById('heroTrainChatStream');
  const typingBubble = document.getElementById('heroTrainTypingBubble');
  const statusText = document.getElementById('heroTrainerStatusText');
  const trainChips = document.querySelectorAll('.hero-train-chip');

  if (!chatStream) return;

  function executeTraining(instruction, targetKey, newVal, statusMsg, isManualClick, onComplete) {
    // Keep max 4 bubbles in stream to maintain clean, focused UI
    if (chatStream.children.length >= 6) {
      chatStream.innerHTML = '';
    }

    // 1. Append merchant instruction bubble
    const merchantBubble = document.createElement('div');
    merchantBubble.className = 'flex items-start justify-end gap-2 transition-all duration-300 opacity-0 translate-y-2';
    merchantBubble.innerHTML = `
      <div class="bg-slate-900 text-white p-3 rounded-2xl rounded-tr-xs max-w-[85%] shadow-xs leading-relaxed">
        <div class="flex items-center gap-1.5 text-[10px] text-indigo-300 font-bold mb-1">
          <svg class="w-3 h-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span>আপনি (মার্চেন্ট):</span>
          <span class="text-slate-400 font-normal">চ্যাটে বললেন</span>
        </div>
        "${instruction}"
      </div>
    `;
    chatStream.appendChild(merchantBubble);
    requestAnimationFrame(() => {
      merchantBubble.classList.remove('opacity-0', 'translate-y-2');
      chatStream.scrollTop = chatStream.scrollHeight;
    });

    // 2. Show typing indicator
    if (typingBubble) typingBubble.classList.remove('hidden');

    setTimeout(() => {
      if (typingBubble) typingBubble.classList.add('hidden');

      // Update Global Memory & Status Badges
      let updatedLabel = 'পলিসি সেভড';
      if (targetKey === 'delivery') {
        window.livingMemory.delivery = newVal || 'ঢাকা ৳৭০, বাইরে ৳১৫০';
        const el = document.getElementById('hlmValDelivery');
        const card = document.getElementById('hlmCardDelivery');
        if (el) el.textContent = window.livingMemory.delivery;
        if (card) {
          card.classList.add('memory-updated');
          setTimeout(() => card.classList.remove('memory-updated'), 1800);
        }
        updatedLabel = 'ডেলিভারি চার্জ: ' + window.livingMemory.delivery;
      } else if (targetKey === 'bkash') {
        window.livingMemory.bkash = newVal || '০১৭১১২২৩৩৪৪ (১০% ছাড়)';
        const el = document.getElementById('hlmValBkash');
        const card = document.getElementById('hlmCardBkash');
        if (el) el.textContent = window.livingMemory.bkash;
        if (card) {
          card.classList.add('memory-updated');
          setTimeout(() => card.classList.remove('memory-updated'), 1800);
        }
        updatedLabel = 'বিকাশ নম্বর ও ক্যাশব্যাক অফার';
      } else if (targetKey === 'return') {
        window.livingMemory.returnPolicy = newVal || '১০ দিনের রিটার্ন গ্যারান্টি';
        const el = document.getElementById('hlmValReturn');
        const card = document.getElementById('hlmCardReturn');
        if (el) el.textContent = window.livingMemory.returnPolicy;
        if (card) {
          card.classList.add('memory-updated');
          setTimeout(() => card.classList.remove('memory-updated'), 1800);
        }
        updatedLabel = 'রিটার্ন পলিসি: ' + window.livingMemory.returnPolicy;
      } else {
        window.livingMemory.offer = newVal || instruction;
        const card = document.getElementById('hlmCardDelivery');
        if (card) {
          card.classList.add('memory-updated');
          setTimeout(() => card.classList.remove('memory-updated'), 1800);
        }
        updatedLabel = 'স্টোর অফার আপডেট';
      }

      // Self-contained in-console status update (no intrusive global toast)
      if (statusText && statusMsg) {
        statusText.textContent = statusMsg;
      }

      // 3. Append AI Response Bubble
      const aiBubble = document.createElement('div');
      aiBubble.className = 'flex items-start gap-2 transition-all duration-300 opacity-0 translate-y-2';
      aiBubble.innerHTML = `
        <div class="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
          M
        </div>
        <div class="bg-indigo-50/80 border border-indigo-200 text-slate-800 p-3 rounded-2xl rounded-tl-xs max-w-[88%] leading-relaxed">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-1 text-[11px] font-bold text-indigo-700">
              <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span>Mogent AI সেলস এজেন্ট:</span>
            </div>
            <span class="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <svg class="w-2.5 h-2.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              <span>মেমোরিতে সেভড</span>
            </span>
          </div>
          <p class="text-slate-700 font-medium">
            জ্বী ভাইয়া! <strong>${updatedLabel}</strong> মেমোরিতে সেভ করে নিয়েছি।<br />
            <span class="text-[11px] text-slate-500 mt-1 block">ডানপাশের কাস্টমার চ্যাটে জিজ্ঞেস করলেই এখন নতুন তথ্য জানানো হবে।</span>
          </p>
        </div>
      `;
      chatStream.appendChild(aiBubble);
      requestAnimationFrame(() => {
        aiBubble.classList.remove('opacity-0', 'translate-y-2');
        chatStream.scrollTop = chatStream.scrollHeight;
      });

      // Sound ONLY when visitor manually clicks a preset chip right there in the trainer
      if (isManualClick) {
        playMemoryUpdateChime();
      }

      if (onComplete) onComplete();
    }, 600);
  }

  // Preset Training Chips (Manual clicks right in the trainer console)
  trainChips.forEach(chip => {
    chip.addEventListener('click', () => {
      clearTimeout(trainerLoopTimer);
      const q = chip.dataset.trainQuery;
      const target = chip.dataset.target;
      const val = chip.dataset.val;
      const title = chip.dataset.title;
      executeTraining(q, target, val, `মেমোরি আপডেট: ${title} সেট করা হয়েছে`, true, () => {
        trainerLoopTimer = setTimeout(scheduleNextTrainingStep, 6000);
      });
    });
  });

  // Automated Continuous Training Showcase Loop (Completely Silent & Non-intrusive)
  const trainingSequence = [
    {
      instruction: 'আজকে থেকে ঢাকার বাইরে ডেলিভারি চার্জ ১৫০ টাকা হবে।',
      target: 'delivery',
      val: 'ঢাকা ৳৭০, বাইরে ৳১৫০',
      status: 'মেমোরি আপডেট: ঢাকার বাইরে ডেলিভারি চার্জ ৳১৫০ সেট করা হয়েছে'
    },
    {
      instruction: 'বিকাশ মার্চেন্টে কেউ পে করলে সরাসরি ১০% ক্যাশব্যাক অফার চালু করো।',
      target: 'bkash',
      val: '০১৭১১২২৩৩৪৪ (১০% ছাড়)',
      status: 'মেমোরি আপডেট: বিকাশ মার্চেন্ট পেমেন্টে ১০% ক্যাশব্যাক অফার চালু'
    },
    {
      instruction: 'আমাদের সব প্রোডাক্টে এখন থেকে ৩ দিনের বদলে ১০ দিনের রিটার্ন সুবিধা থাকবে।',
      target: 'return',
      val: '১০ দিনের রিটার্ন গ্যারান্টি',
      status: 'মেমোরি আপডেট: ১০ দিনের ইজি রিটার্ন পলিসি চালু'
    },
    {
      instruction: 'যেকোনো ২ পিস একসাথে অর্ডার করলেই সারা দেশে হোম ডেলিভারি ফ্রি দাও।',
      target: 'delivery',
      val: '২ পিসে ফ্রি ডেলিভারি',
      status: 'মেমোরি আপডেট: ২ পিস অর্ডারে অল-বাংলাদেশ ফ্রি হোম ডেলিভারি চালু'
    }
  ];

  let currentTrainStep = 0;
  let trainerLoopTimer = null;

  function scheduleNextTrainingStep() {
    clearTimeout(trainerLoopTimer);
    const step = trainingSequence[currentTrainStep];
    // isManualClick is false -> zero sound, zero screen toasts
    executeTraining(step.instruction, step.target, step.val, step.status, false, () => {
      currentTrainStep = (currentTrainStep + 1) % trainingSequence.length;
      trainerLoopTimer = setTimeout(scheduleNextTrainingStep, 5500);
    });
  }

  // Start automated training loop after initial 3 seconds
  trainerLoopTimer = setTimeout(scheduleNextTrainingStep, 3000);
}

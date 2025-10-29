// public/js/cc-acceptui.js
(function () {
  let cfg = null;

  function $(sel) { return document.querySelector(sel); }

  async function fetchConfig() {
    try {
      const r = await fetch('/api/payments/config');
      const j = await r.json();
      if (j && j.success) return j.config;
      console.warn('AcceptUI config unavailable:', j?.error || 'unknown');
      return null;
    } catch (e) {
      console.error('AcceptUI config fetch failed:', e);
      return null;
    }
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if ([...document.scripts].some(s => s.src === src)) return res();
      const el = document.createElement('script');
      el.src = src;
      el.onload = res;
      el.onerror = rej;
      document.head.appendChild(el);
    });
  }

  // async function charge(amount, description, opaqueData) {
  //   const body = {
  //     amount,
  //     description,
  //     opaqueData,
  //     user_id: $('#ccRoot')?.dataset.userId || null,
  //     plan_name: $('#ccRoot')?.dataset.selectedPlan || null
  //   };
  //   const r = await fetch('/api/payments/charge', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(body)
  //   });
  //   return r.json();
  // }
  async function charge(amount, description, opaqueData) {
    const body = {
      amount,
      description,
      opaqueData,
      user_id: $('#ccRoot')?.dataset.userId || null,
      plan_name: $('#ccRoot')?.dataset.selectedPlan || null
    };
    
    // Determine endpoint based on plan type
    const endpoint = window.isSubscription ? '/api/payments/subscribe' : '/api/payments/charge';
    
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let payload;
const ct = r.headers.get('content-type') || '';

if (ct.includes('application/json')) {
  payload = await r.json();
} else {
  const text = await r.text();
  payload = { success: false, message: `HTTP ${r.status}: ${text.slice(0,200)}` };
}

return payload;
  }

  function formatCurrency(v) {
    const n = Number(v || 0);
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  // Global response handler
  window.acceptUIResponseHandler = async function (response) {
    console.log('🔧 AcceptUI Response Handler called:', response);
    
    try {
      if (response?.messages?.resultCode !== 'Ok') {
        const msg = response?.messages?.message?.[0]?.text || 'Payment form error';
        const inlineError = document.getElementById('inlineError');
        if (inlineError) {
          inlineError.textContent = 'Payment form error: ' + msg;
          inlineError.classList.remove('hidden');
        }
        return;
      }

      const opaqueData = response.opaqueData;
      console.log('\n🔑 [FRONTEND] ========== ACCEPTUI CREDENTIALS USED TO GENERATE TOKEN ==========');
      console.log('🔑 [FRONTEND] Timestamp:', new Date().toISOString());
      
      const acceptUIButton = document.getElementById('staticAcceptUIButton');
      const frontendApiLoginId = acceptUIButton?.getAttribute('data-apiLoginID') || 'NOT FOUND';
      const frontendClientKey = acceptUIButton?.getAttribute('data-clientKey') ? 'SET (hidden)' : 'NOT FOUND';
      const frontendEnv = acceptUIButton?.getAttribute('data-environment') || 'NOT FOUND';
      
      console.log('🔑 [FRONTEND] API Login ID (first 4, last 4):', 
        frontendApiLoginId !== 'NOT FOUND' 
          ? `${frontendApiLoginId.substring(0, 4)}...${frontendApiLoginId.substring(frontendApiLoginId.length - 4)}` 
          : 'NOT FOUND');
      console.log('🔑 [FRONTEND] API Login ID FULL:', frontendApiLoginId);
      console.log('🔑 [FRONTEND] Client Key:', frontendClientKey);
      console.log('🔑 [FRONTEND] Environment:', frontendEnv);
      console.log('🔑 [FRONTEND] ========== END FRONTEND CREDENTIALS ==========\n');
      // ========== ACCEPTUI ENVIRONMENT CHECK ==========
      console.log('\n🎯 [FRONTEND] ========== ACCEPTUI RESPONSE HANDLER ==========');
      console.log('🎯 [FRONTEND] Timestamp:', new Date().toISOString());
      
      // Log AcceptUI environment details
      // const acceptUIButton = document.getElementById('staticAcceptUIButton');
      const buttonEnv = acceptUIButton?.getAttribute('data-environment') || 'NOT FOUND';
      const configEnv = window.acceptUIConfig?.environment || 'NOT FOUND';
      const apiLoginId = acceptUIButton?.getAttribute('data-apiLoginID') || 'NOT FOUND';
      const clientKey = acceptUIButton?.getAttribute('data-clientKey') ? 'SET (hidden)' : 'NOT FOUND';
      
      // Detect actual AcceptUI script source
      const scripts = Array.from(document.scripts);
      const acceptUIScript = scripts.find(s => s.src && (s.src.includes('AcceptUI.js') || s.src.includes('authorize.net')));
      const scriptSrc = acceptUIScript?.src || 'NOT FOUND';
      const isProductionScript = scriptSrc.includes('js.authorize.net');
      const isSandboxScript = scriptSrc.includes('jstest.authorize.net');
      
      console.log('🎯 [FRONTEND] ========== ACCEPTUI ENVIRONMENT CHECK ==========');
      console.log('🎯 [FRONTEND] Button data-environment:', buttonEnv);
      console.log('🎯 [FRONTEND] Config environment:', configEnv);
      console.log('🎯 [FRONTEND] AcceptUI Script Source:', scriptSrc);
      console.log('🎯 [FRONTEND] Is Production Script?', isProductionScript);
      console.log('🎯 [FRONTEND] Is Sandbox Script?', isSandboxScript);
      console.log('🎯 [FRONTEND] Detected Environment:', isProductionScript ? 'PRODUCTION' : isSandboxScript ? 'SANDBOX' : 'UNKNOWN');
      console.log('🎯 [FRONTEND] API Login ID:', apiLoginId !== 'NOT FOUND' ? `${apiLoginId.substring(0, 4)}...${apiLoginId.substring(apiLoginId.length - 4)}` : 'NOT FOUND');
      console.log('🎯 [FRONTEND] Client Key:', clientKey);
      console.log('🎯 [FRONTEND] ========== END ENVIRONMENT CHECK ==========\n');
      // ========== END ENVIRONMENT CHECK ==========
      
      // ========== DETAILED OPAQUE DATA LOGGING ==========
      console.log('🎯 [FRONTEND] Full AcceptUI Response:', JSON.stringify(response, null, 2));
      console.log('🎯 [FRONTEND] Opaque Data Object:', JSON.stringify(opaqueData, null, 2));
      console.log('🎯 [FRONTEND] Opaque Data Type:', typeof opaqueData);
      console.log('🎯 [FRONTEND] dataDescriptor:', opaqueData?.dataDescriptor);
      console.log('🎯 [FRONTEND] dataDescriptor Type:', typeof opaqueData?.dataDescriptor);
      console.log('🎯 [FRONTEND] dataDescriptor Length:', opaqueData?.dataDescriptor?.length || 0);
      console.log('🎯 [FRONTEND] dataValue:', opaqueData?.dataValue);
      console.log('🎯 [FRONTEND] dataValue Type:', typeof opaqueData?.dataValue);
      console.log('🎯 [FRONTEND] dataValue Length:', opaqueData?.dataValue?.length || 0);
      
      // E00114 Specific Validation
      if (opaqueData?.dataValue) {
        const dv = opaqueData.dataValue;
        console.log('🎯 [FRONTEND] dataValue Character Codes:', Array.from(dv.slice(0, 50)).map(c => c.charCodeAt(0)));
        console.log('🎯 [FRONTEND] Has Whitespace?', /\s/.test(dv));
        console.log('🎯 [FRONTEND] Has Newlines?', /\n|\r/.test(dv));
        console.log('🎯 [FRONTEND] Is Empty String?', dv === '');
        console.log('🎯 [FRONTEND] First 100 chars:', dv.substring(0, 100));
        console.log('🎯 [FRONTEND] Last 100 chars:', dv.substring(Math.max(0, dv.length - 100)));
      }
      console.log('🎯 [FRONTEND] ========== END ACCEPTUI LOGGING ==========\n');
      // ========== END OPAQUE DATA LOGGING ==========
      // ========== DETAILED OPAQUE DATA LOGGING ==========
      const acceptUIEnv = window.acceptUIConfig?.environment || 'unknown';
      // const acceptUIButton = document.getElementById('staticAcceptUIButton');
      // const buttonEnv = acceptUIButton?.getAttribute('data-environment') || 'unknown';
      console.log('🎯 [FRONTEND] AcceptUI Config Environment:', acceptUIEnv);
      console.log('🎯 [FRONTEND] AcceptUI Button Environment:', buttonEnv);
      console.log('🎯 [FRONTEND] AcceptUI Script Source:', acceptUIEnv === 'production' ? 'js.authorize.net' : 'jstest.authorize.net');
      console.log('🎯 [FRONTEND] ========== ENVIRONMENT LOG ==========\n');

      console.log('\n🎯 [FRONTEND] ========== ACCEPTUI RESPONSE HANDLER ==========');
      console.log('🎯 [FRONTEND] Timestamp:', new Date().toISOString());
      console.log('🎯 [FRONTEND] Full AcceptUI Response:', JSON.stringify(response, null, 2));
      console.log('🎯 [FRONTEND] Opaque Data Object:', JSON.stringify(opaqueData, null, 2));
      console.log('🎯 [FRONTEND] Opaque Data Type:', typeof opaqueData);
      console.log('🎯 [FRONTEND] dataDescriptor:', opaqueData?.dataDescriptor);
      console.log('🎯 [FRONTEND] dataDescriptor Type:', typeof opaqueData?.dataDescriptor);
      console.log('🎯 [FRONTEND] dataDescriptor Length:', opaqueData?.dataDescriptor?.length || 0);
      console.log('🎯 [FRONTEND] dataValue:', opaqueData?.dataValue);
      console.log('🎯 [FRONTEND] dataValue Type:', typeof opaqueData?.dataValue);
      console.log('🎯 [FRONTEND] dataValue Length:', opaqueData?.dataValue?.length || 0);
      
      // E00114 Specific Validation
      if (opaqueData?.dataValue) {
        const dv = opaqueData.dataValue;
        console.log('🎯 [FRONTEND] dataValue Character Codes:', Array.from(dv.slice(0, 50)).map(c => c.charCodeAt(0)));
        console.log('🎯 [FRONTEND] Has Whitespace?', /\s/.test(dv));
        console.log('🎯 [FRONTEND] Has Newlines?', /\n|\r/.test(dv));
        console.log('🎯 [FRONTEND] Is Empty String?', dv === '');
        console.log('🎯 [FRONTEND] First 100 chars:', dv.substring(0, 100));
        console.log('🎯 [FRONTEND] Last 100 chars:', dv.substring(Math.max(0, dv.length - 100)));
      }
      console.log('🎯 [FRONTEND] ========== END ACCEPTUI LOGGING ==========\n');
      const amountEl = $('#amountInput');
      const descEl = $('#descriptionInput');
      const amount = Number((amountEl?.value || '0').replace(/[^0-9.]/g, ''));
      const description = (descEl?.value || 'Gold Investment');

      if (!amount || amount <= 0) {
        const inlineError = document.getElementById('inlineError');
        if (inlineError) {
          inlineError.textContent = 'Please enter a valid amount';
          inlineError.classList.remove('hidden');
        }
        return;
      }

      const btns = document.querySelectorAll('.AcceptUI, .primary-action-btn');
      console.log('\n📤 [FRONTEND] ========== SENDING OPAQUE DATA TO BACKEND ==========');
      console.log('📤 [FRONTEND] Timestamp:', new Date().toISOString());
      console.log('📤 [FRONTEND] Endpoint:', window.isSubscription ? '/api/payments/subscribe' : '/api/payments/charge');
      console.log('📤 [FRONTEND] Amount:', amount);
      console.log('📤 [FRONTEND] Description:', description);
      console.log('📤 [FRONTEND] Is Subscription?', window.isSubscription);
      console.log('📤 [FRONTEND] Full Opaque Data Object:', JSON.stringify(opaqueData, null, 2));
      console.log('📤 [FRONTEND] dataDescriptor:', opaqueData?.dataDescriptor);
      console.log('📤 [FRONTEND] dataDescriptor Length:', opaqueData?.dataDescriptor?.length || 0);
      console.log('📤 [FRONTEND] dataValue:', opaqueData?.dataValue);
      console.log('📤 [FRONTEND] dataValue Length:', opaqueData?.dataValue?.length || 0);
      console.log('📤 [FRONTEND] Full Request Body:', JSON.stringify({
        amount,
        description,
        opaqueData,
        user_id: $('#ccRoot')?.dataset.userId || null,
        plan_name: $('#ccRoot')?.dataset.selectedPlan || null
      }, null, 2));
      console.log('📤 [FRONTEND] ========== END SEND LOGGING ==========\n');
      // ========== END SEND LOGGING ==========
      btns.forEach(b => { b.disabled = true; b.textContent = 'Processing...'; });

      const res = await charge(amount, description, opaqueData);

      if (res?.success) {
        const successView = document.getElementById('successView');
        const successTitle = successView.querySelector('.success-title');
        const successAmount = document.getElementById('successAmount');
        const successAccount = document.getElementById('successAccount');
        const successDate = document.getElementById('successDate');

        if (successTitle) {
          successTitle.textContent = window.isSubscription ? 'Subscription Created!' : 'Payment successful';
        }
      

        // if (successAmount) successAmount.textContent = formatCurrency(amount);
        // if (successAccount) successAccount.textContent = 'Credit Card';
        // if (successDate) successDate.textContent = new Date().toLocaleDateString();

        // if (successView) {
        //   successView.classList.remove('hidden');
        //   const primaryActionArea = document.getElementById('primaryActionArea');
        //   if (primaryActionArea) primaryActionArea.style.display = 'none';
        // }
        if (successAccount) {
          successAccount.textContent = window.isSubscription ? 
            res.planName : 
            'Credit Card';
        }
      
        // Update date display
        if (successDate) {
          successDate.textContent = window.isSubscription ? 
            res.nextBillingDate : 
            new Date().toLocaleDateString();
        }
      
        if (successView) {
          successView.classList.remove('hidden');
          const primaryActionArea = document.getElementById('primaryActionArea');
          if (primaryActionArea) primaryActionArea.style.display = 'none';
        }
        const amountInput = document.getElementById('amountInput');
        const descriptionInput = document.getElementById('descriptionInput');
        const inlineError = document.getElementById('inlineError');
        
        if (amountInput) amountInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (inlineError) {
          inlineError.textContent = '';
          inlineError.classList.add('hidden');
        }
        
        // Update order summary
        const orderAmount = document.getElementById('orderAmount');
        const orderTotal = document.getElementById('orderTotal');
        if (orderAmount) orderAmount.textContent = '$0.00';
        if (orderTotal) orderTotal.textContent = '$0.00';
        setTimeout(function() {
          const newPaymentBtn = document.getElementById('newPaymentBtn');
          if (newPaymentBtn) {
            newPaymentBtn.click();
          }
        }, 2000);

      } else {
        const inlineError = document.getElementById('inlineError');
        if (inlineError) {
          inlineError.textContent = 'Payment failed: ' + (res?.message || 'Unknown error');
          inlineError.classList.remove('hidden');
        }
      }
    } catch (err) {
      console.error('AcceptUI handler error:', err);
      const inlineError = document.getElementById('inlineError');
      if (inlineError) {
        inlineError.textContent = 'Payment processing failed. Please try again.';
        inlineError.classList.remove('hidden');
      }
    } finally {
      const btns = document.querySelectorAll('.AcceptUI, .primary-action-btn');
      btns.forEach(b => { b.disabled = false; b.textContent = 'Pay with Credit Card'; });
    }
  };

  // Initialize AcceptUI
  async function initializeAcceptUI() {
    console.log('🔧 AcceptUI: Initializing...');
    
    // Fetch config first
    cfg = await fetchConfig();
    if (!cfg) {
      console.error('❌ AcceptUI: Config fetch failed');
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
      return;
    }

    console.log('🔍 DEBUG - Actual credentials being used:');
console.log('  - apiLoginId:', cfg.apiLoginId ? `${cfg.apiLoginId.substring(0,4)}...${cfg.apiLoginId.substring(cfg.apiLoginId.length-4)}` : 'MISSING');
console.log('  - clientKey:', cfg.clientKey ? `${cfg.clientKey.substring(0,4)}...${cfg.clientKey.substring(cfg.clientKey.length-4)}` : 'MISSING');
console.log('  - environment:', cfg.environment);

    // Make config available globally
    window.acceptUIConfig = cfg;

    // Set up the static button with config immediately
    const staticButton = document.getElementById('staticAcceptUIButton');
    if (staticButton) {
      
      // DEBUG: Verify what was actually set on the button
  console.log('🔍 DEBUG - Button attributes after setting:');
  console.log('  - data-apiLoginID:', staticButton.getAttribute('data-apiLoginID'));
  console.log('  - data-clientKey:', staticButton.getAttribute('data-clientKey'));
  console.log('  - data-environment:', staticButton.getAttribute('data-environment'));
  console.log('✅ AcceptUI: Static button configured with:', {
    apiLoginId: cfg.apiLoginId ? 'Set' : 'Missing',
    clientKey: cfg.clientKey ? 'Set' : 'Missing',
    environment: cfg.environment
  });
}
  console.log('🔍 DEBUG - Config environment:', cfg.environment);
  console.log('🔍 DEBUG - Config apiLoginId:', cfg);
    const src = cfg.environment === 'production'
      ? 'https://js.authorize.net/v3/AcceptUI.js'
      : 'https://jstest.authorize.net/v3/AcceptUI.js';

    try {
      console.log('🔧 AcceptUI: Loading script from:', src);
      await loadScript(src);
      
      // Wait for AcceptUI to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ AcceptUI: Script loaded and ready');
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: true } }));
      
    } catch (e) {
      console.error('❌ AcceptUI: Script load failed:', e);
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAcceptUI);
  } else {
    initializeAcceptUI();
  }

  // Function to show/hide the static AcceptUI button
  window.toggleAcceptUIButton = function(show) {
    const acceptButton = document.getElementById('staticAcceptUIButton');
    if (acceptButton) {
      acceptButton.style.display = show ? 'block' : 'none';
    }
  };
  window.initializeAcceptUI = initializeAcceptUI;

})();

// DEBUG: Add AcceptUI error handling
window.addEventListener('error', function(e) {
  if (e.message && e.message.includes('AcceptUI')) {
    console.error('🚨 AcceptUI Error:', e.message);
  }
});

// DEBUG: Listen for AcceptUI specific events
window.addEventListener('message', function(e) {
  if (e.data && typeof e.data === 'object') {
    console.log('🔍 AcceptUI Message:', e.data);
  }
});
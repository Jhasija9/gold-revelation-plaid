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

  async function charge(amount, description, opaqueData) {
    const body = {
      amount,
      description,
      opaqueData,
      user_id: $('#ccRoot')?.dataset.userId || null,
      plan_name: $('#ccRoot')?.dataset.selectedPlan || null
    };
    const r = await fetch('/api/payments/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return r.json();
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
      btns.forEach(b => { b.disabled = true; b.textContent = 'Processing...'; });

      const res = await charge(amount, description, opaqueData);

      if (res?.success) {
        const successView = document.getElementById('successView');
        const successAmount = document.getElementById('successAmount');
        const successAccount = document.getElementById('successAccount');
        const successDate = document.getElementById('successDate');

        if (successAmount) successAmount.textContent = formatCurrency(amount);
        if (successAccount) successAccount.textContent = 'Credit Card';
        if (successDate) successDate.textContent = new Date().toLocaleDateString();

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
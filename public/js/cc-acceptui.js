// public/js/cc-acceptui.js
(function () {
  let cfg = null;
  let acceptLoaded = false;
  let acceptUIReady = false;

  function $(sel) { return document.querySelector(sel); }

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

  // Create required DOM structure for AcceptUI
  function createAcceptUIStructure() {
    // Create a hidden container for AcceptUI
    let acceptContainer = document.getElementById('acceptUIContainer');
    if (!acceptContainer) {
      acceptContainer = document.createElement('div');
      acceptContainer.id = 'acceptUIContainer';
      acceptContainer.style.display = 'none';
      document.body.appendChild(acceptContainer);
    }

    // Create a hidden button that AcceptUI can initialize with
    let acceptButton = document.getElementById('acceptUIButton');
    if (!acceptButton) {
      acceptButton = document.createElement('button');
      acceptButton.id = 'acceptUIButton';
      acceptButton.className = 'AcceptUI';
      acceptButton.style.display = 'none';
      acceptContainer.appendChild(acceptButton);
    }

    return { acceptContainer, acceptButton };
  }

  // Function to add AcceptUI attributes to any button
  function addAcceptUIAttributes(button) {
    if (!cfg || !acceptUIReady) {
      console.warn('AcceptUI not ready, cannot add attributes');
      return false;
    }
    
    try {
      // Copy attributes from the initialized AcceptUI button
      const acceptButton = document.getElementById('acceptUIButton');
      if (acceptButton) {
        // Copy all data attributes
        const dataAttrs = acceptButton.attributes;
        for (let i = 0; i < dataAttrs.length; i++) {
          const attr = dataAttrs[i];
          if (attr.name.startsWith('data-')) {
            button.setAttribute(attr.name, attr.value);
          }
        }
        
        // Copy class
        button.classList.add('AcceptUI');
        
        console.log('✅ AcceptUI attributes copied to button');
        return true;
      } else {
        console.warn('⚠️ AcceptUI button not found, using fallback attributes');
        
        // Fallback: add basic attributes
        button.classList.add('AcceptUI');
        button.setAttribute('data-billingAddressOptions', '{"show":true,"required":false}');
        button.setAttribute('data-apiLoginID', cfg.apiLoginId);
        button.setAttribute('data-clientKey', cfg.clientKey);
        button.setAttribute('data-paymentOptions', '{"showCreditCard":true,"showBankAccount":false}');
        button.setAttribute('data-acceptUIFormBtnTxt', 'Pay Securely');
        button.setAttribute('data-acceptUIFormHeaderTxt', 'Card Information');
        button.setAttribute('data-responseHandler', 'acceptUIResponseHandler');
        
        return true;
      }
    } catch (e) {
      console.error('❌ Failed to add AcceptUI attributes:', e);
      return false;
    }
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
    
    // Create required DOM structure first
    const { acceptContainer, acceptButton } = createAcceptUIStructure();
    
    // Fetch config
    cfg = await fetchConfig();
    if (!cfg) {
      console.error('❌ AcceptUI: Config fetch failed');
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
      return;
    }

    console.log('✅ AcceptUI: Config loaded:', { 
      apiLoginId: cfg.apiLoginId ? 'Set' : 'Missing',
      clientKey: cfg.clientKey ? 'Set' : 'Missing',
      environment: cfg.environment 
    });

    // Make config available globally
    window.acceptUIConfig = cfg;

    // Set up the AcceptUI button with proper attributes
    acceptButton.setAttribute('data-billingAddressOptions', '{"show":true,"required":false}');
    acceptButton.setAttribute('data-apiLoginID', cfg.apiLoginId);
    acceptButton.setAttribute('data-clientKey', cfg.clientKey);
    acceptButton.setAttribute('data-paymentOptions', '{"showCreditCard":true,"showBankAccount":false}');
    acceptButton.setAttribute('data-acceptUIFormBtnTxt', 'Pay Securely');
    acceptButton.setAttribute('data-acceptUIFormHeaderTxt', 'Card Information');
    acceptButton.setAttribute('data-responseHandler', 'acceptUIResponseHandler');

    const src = cfg.environment === 'production'
      ? 'https://js.authorize.net/v3/AcceptUI.js'
      : 'https://jstest.authorize.net/v3/AcceptUI.js';

    try {
      console.log('🔧 AcceptUI: Loading script from:', src);
      await loadScript(src);
      acceptLoaded = true;
      
      // Wait for AcceptUI to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if AcceptUI is available and working
      if (window.AcceptUI && typeof window.AcceptUI === 'object') {
        acceptUIReady = true;
        console.log('✅ AcceptUI: Script loaded and ready');
        window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: true } }));
      } else {
        console.warn('⚠️ AcceptUI: Script loaded but AcceptUI object not found');
        window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
      }
      
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

  // Expose the addAcceptUIAttributes function globally
  window.addAcceptUIAttributes = addAcceptUIAttributes;
})();
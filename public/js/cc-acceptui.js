// public/js/cc-acceptui.js
(function () {
  let cfg = null;
  let acceptLoaded = false;

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

  function renderButton(root, container) {
    container.innerHTML =
      '<button ' +
      'class="AcceptUI pay-btn" ' +
      'data-billingAddressOptions=\'{"show":true,"required":false}\' ' +
      'data-apiLoginID="' + cfg.apiLoginId + '" ' +
      'data-clientKey="' + cfg.clientKey + '" ' +
      'data-paymentOptions=\'{"showCreditCard":true,"showBankAccount":false}\' ' +
      'data-acceptUIFormBtnTxt="Pay Securely" ' +
      'data-acceptUIFormHeaderTxt="Card Information" ' +
      'data-responseHandler="acceptUIResponseHandler">' +
      'Pay with Credit Card' +
      '</button>';
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

  // Show error in inline error display
  function showError(message) {
    const errorEl = document.getElementById('inline-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  // Hide error display
  function hideError() {
    const errorEl = document.getElementById('inline-error');
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }

  window.acceptUIResponseHandler = async function (response) {
    try {
      if (response?.messages?.resultCode !== 'Ok') {
        const msg = response?.messages?.message?.[0]?.text || 'Payment form error';
        showError('Payment form error: ' + msg);
        return;
      }

      const opaqueData = response.opaqueData;
      // Use unified amount and description fields
      const amountEl = $('#amountInput');
      const descEl = $('#descriptionInput');
      const amount = Number((amountEl?.value || '0').replace(/[^0-9.]/g, ''));
      const description = (descEl?.value || $('#ccRoot')?.dataset.selectedPlan || 'Gold Investment');

      if (!amount || amount <= 0) {
        showError('Please enter a valid amount');
        return;
      }

      // Disable dynamic action button
      const dynamicBtn = document.getElementById('dynamicActionBtn');
      if (dynamicBtn) {
        dynamicBtn.disabled = true;
        dynamicBtn.innerHTML = '<span class="spinner"></span>Processing...';
      }

      const res = await charge(amount, description, opaqueData);

      if (res?.success) {
        // Show success view
        const successView = document.getElementById('successView');
        const successAmount = document.getElementById('successAmount');
        const successAccount = document.getElementById('successAccount');
        const successDate = document.getElementById('successDate');

        if (successAmount) successAmount.textContent = formatCurrency(amount);
        if (successAccount) successAccount.textContent = 'Credit Card';
        if (successDate) successDate.textContent = new Date().toLocaleDateString();

        if (successView) {
          successView.classList.remove('hidden');
          // Hide other sections
          const bankAccountSelect = document.getElementById('bankAccountSelect');
          const connectedBadge = document.getElementById('connectedBadge');
          const primaryAction = document.getElementById('primary-action');
          const acceptContainer = document.getElementById('acceptUIContainer');
          
          if (bankAccountSelect) bankAccountSelect.classList.add('hidden');
          if (connectedBadge) connectedBadge.classList.add('hidden');
          if (primaryAction) primaryAction.classList.add('hidden');
          if (acceptContainer) acceptContainer.classList.add('hidden');
        }
      } else {
        showError('Payment failed: ' + (res?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('AcceptUI handler error:', err);
      showError('Payment processing failed. Please try again.');
    } finally {
      // Re-enable dynamic action button
      const dynamicBtn = document.getElementById('dynamicActionBtn');
      if (dynamicBtn) {
        dynamicBtn.disabled = false;
        dynamicBtn.textContent = 'Pay with Credit Card';
      }
    }
  };

  // Initialize AcceptUI when called
  window.initializeAcceptUI = async function() {
    const root = document.getElementById('ccRoot');
    const acceptContainer = document.getElementById('acceptUIContainer');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (!root || !acceptContainer) return;

    // Don't initialize if already loaded
    if (acceptLoaded) {
      if (window.setCardFormReady) {
        window.setCardFormReady(true);
      }
      return;
    }

    cfg = await fetchConfig();
    if (!cfg) {
      if (loadingIndicator) {
        loadingIndicator.textContent = 'Card payments currently unavailable.';
        loadingIndicator.classList.remove('hidden');
      }
      return;
    }

    const src = cfg.environment === 'production'
      ? 'https://js.authorize.net/v3/AcceptUI.js'
      : 'https://jstest.authorize.net/v3/AcceptUI.js';

    try {
      await loadScript(src);
      acceptLoaded = true;
      renderButton(root, acceptContainer);
      
      // Notify main script that card form is ready
      if (window.setCardFormReady) {
        window.setCardFormReady(true);
      }
      
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
      }
    } catch (e) {
      console.error('AcceptUI script load failed:', e);
      if (loadingIndicator) {
        loadingIndicator.textContent = 'Unable to load secure payment form.';
        loadingIndicator.classList.remove('hidden');
      }
    }
  };

  // Auto-initialize on DOM ready (fallback)
  document.addEventListener('DOMContentLoaded', function() {
    // Only auto-initialize if card method is already selected
    const cardRadio = document.getElementById('cardRadio');
    if (cardRadio && cardRadio.checked) {
      setTimeout(() => {
        if (window.initializeAcceptUI) {
          window.initializeAcceptUI();
        }
      }, 100);
    }
  });
})();
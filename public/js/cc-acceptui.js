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

  window.acceptUIResponseHandler = async function (response) {
    try {
      if (response?.messages?.resultCode !== 'Ok') {
        const msg = response?.messages?.message?.[0]?.text || 'Payment form error';
        alert('Payment form error: ' + msg);
        return;
      }

      const opaqueData = response.opaqueData;
      const amountEl = $('#ccAmount');
      const descEl = $('#ccDescription');
      const amount = Number((amountEl?.value || '0').replace(/[^0-9.]/g, ''));
      const description = (descEl?.value || $('#ccRoot')?.dataset.selectedPlan || 'Gold Investment');

      if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const btns = document.querySelectorAll('.AcceptUI, .pay-btn');
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
          // Optionally hide other sections without touching Plaid internals
          const paymentDetails = document.getElementById('paymentDetails');
          if (paymentDetails) paymentDetails.classList.add('hidden');
        }
      } else {
        alert('Payment failed: ' + (res?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('AcceptUI handler error:', err);
      alert('Payment processing failed. Please try again.');
    } finally {
      const btns = document.querySelectorAll('.AcceptUI, .pay-btn');
      btns.forEach(b => { b.disabled = false; b.textContent = 'Pay with Credit Card'; });
    }
  };

  document.addEventListener('DOMContentLoaded', async function () {
    const root = document.getElementById('ccRoot');
    const section = document.getElementById('cardSection');
    const acceptContainer = document.getElementById('acceptUIContainer');
    if (!root || !section || !acceptContainer) return; // No-op if not present

    cfg = await fetchConfig();
    if (!cfg) {
      section.querySelector('.cc-status')?.replaceChildren(document.createTextNode('Card payments currently unavailable.'));
      return;
    }

    const src = cfg.environment === 'production'
      ? 'https://js.authorize.net/v3/AcceptUI.js'
      : 'https://jstest.authorize.net/v3/AcceptUI.js';

    try {
      await loadScript(src);
      acceptLoaded = true;
      renderButton(root, acceptContainer);
    } catch (e) {
      console.error('AcceptUI script load failed:', e);
      section.querySelector('.cc-status')?.replaceChildren(document.createTextNode('Unable to load secure payment form.'));
    }

    // Basic amount formatting on blur (non-intrusive)
    const amt = document.getElementById('ccAmount');
    if (amt) {
      amt.addEventListener('blur', function () {
        const n = Number((this.value || '0').replace(/[^0-9.]/g, ''));
        if (n > 0) this.value = n.toFixed(2);
      });
    }
  });
})();

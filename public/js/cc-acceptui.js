// // // public/js/cc-acceptui.js
// // (function () {
// //   let cfg = null;
// //   let acceptLoaded = false;

// //   function $(sel) { return document.querySelector(sel); }

// //   function loadScript(src) {
// //     return new Promise((res, rej) => {
// //       if ([...document.scripts].some(s => s.src === src)) return res();
// //       const el = document.createElement('script');
// //       el.src = src;
// //       el.onload = res;
// //       el.onerror = rej;
// //       document.head.appendChild(el);
// //     });
// //   }

// //   async function fetchConfig() {
// //     try {
// //       const r = await fetch('/api/payments/config');
// //       const j = await r.json();
// //       if (j && j.success) return j.config;
// //       console.warn('AcceptUI config unavailable:', j?.error || 'unknown');
// //       return null;
// //     } catch (e) {
// //       console.error('AcceptUI config fetch failed:', e);
// //       return null;
// //     }
// //   }

// //   function renderButton(root, container) {
// //     container.innerHTML =
// //       '<button ' +
// //       'class="AcceptUI pay-btn" ' +
// //       'data-billingAddressOptions=\'{"show":true,"required":false}\' ' +
// //       'data-apiLoginID="' + cfg.apiLoginId + '" ' +
// //       'data-clientKey="' + cfg.clientKey + '" ' +
// //       'data-paymentOptions=\'{"showCreditCard":true,"showBankAccount":false}\' ' +
// //       'data-acceptUIFormBtnTxt="Pay Securely" ' +
// //       'data-acceptUIFormHeaderTxt="Card Information" ' +
// //       'data-responseHandler="acceptUIResponseHandler">' +
// //       'Pay with Credit Card' +
// //       '</button>';
// //   }

// //   async function charge(amount, description, opaqueData) {
// //     const body = {
// //       amount,
// //       description,
// //       opaqueData,
// //       user_id: $('#ccRoot')?.dataset.userId || null,
// //       plan_name: $('#ccRoot')?.dataset.selectedPlan || null
// //     };
// //     const r = await fetch('/api/payments/charge', {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify(body)
// //     });
// //     return r.json();
// //   }

// //   function formatCurrency(v) {
// //     const n = Number(v || 0);
// //     return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
// //   }

// //   window.acceptUIResponseHandler = async function (response) {
// //     try {
// //       if (response?.messages?.resultCode !== 'Ok') {
// //         const msg = response?.messages?.message?.[0]?.text || 'Payment form error';
// //         alert('Payment form error: ' + msg);
// //         return;
// //       }

// //       const opaqueData = response.opaqueData;
// //       const amountEl = $('#ccAmount');
// //       const descEl = $('#ccDescription');
// //       const amount = Number((amountEl?.value || '0').replace(/[^0-9.]/g, ''));
// //       const description = (descEl?.value || $('#ccRoot')?.dataset.selectedPlan || 'Gold Investment');

// //       if (!amount || amount <= 0) {
// //         alert('Please enter a valid amount');
// //         return;
// //       }

// //       const btns = document.querySelectorAll('.AcceptUI, .pay-btn');
// //       btns.forEach(b => { b.disabled = true; b.textContent = 'Processing...'; });

// //       const res = await charge(amount, description, opaqueData);

// //       if (res?.success) {
// //         const successView = document.getElementById('successView');
// //         const successAmount = document.getElementById('successAmount');
// //         const successAccount = document.getElementById('successAccount');
// //         const successDate = document.getElementById('successDate');

// //         if (successAmount) successAmount.textContent = formatCurrency(amount);
// //         if (successAccount) successAccount.textContent = 'Credit Card';
// //         if (successDate) successDate.textContent = new Date().toLocaleDateString();

// //         if (successView) {
// //           successView.classList.remove('hidden');
// //           // Optionally hide other sections without touching Plaid internals
// //           const paymentDetails = document.getElementById('paymentDetails');
// //           if (paymentDetails) paymentDetails.classList.add('hidden');
// //         }
// //       } else {
// //         alert('Payment failed: ' + (res?.message || 'Unknown error'));
// //       }
// //     } catch (err) {
// //       console.error('AcceptUI handler error:', err);
// //       alert('Payment processing failed. Please try again.');
// //     } finally {
// //       const btns = document.querySelectorAll('.AcceptUI, .pay-btn');
// //       btns.forEach(b => { b.disabled = false; b.textContent = 'Pay with Credit Card'; });
// //     }
// //   };

// //   document.addEventListener('DOMContentLoaded', async function () {
// //     const root = document.getElementById('ccRoot');
// //     const section = document.getElementById('cardSection');
// //     const acceptContainer = document.getElementById('acceptUIContainer');
// //     if (!root || !section || !acceptContainer) return; // No-op if not present

// //     cfg = await fetchConfig();
// //     if (!cfg) {
// //       section.querySelector('.cc-status')?.replaceChildren(document.createTextNode('Card payments currently unavailable.'));
// //       return;
// //     }

// //     const src = cfg.environment === 'production'
// //       ? 'https://js.authorize.net/v3/AcceptUI.js'
// //       : 'https://jstest.authorize.net/v3/AcceptUI.js';

// //     try {
// //       await loadScript(src);
// //       acceptLoaded = true;
// //       renderButton(root, acceptContainer);
// //     } catch (e) {
// //       console.error('AcceptUI script load failed:', e);
// //       section.querySelector('.cc-status')?.replaceChildren(document.createTextNode('Unable to load secure payment form.'));
// //     }

// //     // Basic amount formatting on blur (non-intrusive)
// //     const amt = document.getElementById('ccAmount');
// //     if (amt) {
// //       amt.addEventListener('blur', function () {
// //         const n = Number((this.value || '0').replace(/[^0-9.]/g, ''));
// //         if (n > 0) this.value = n.toFixed(2);
// //       });
// //     }
// //   });
// // })();

// // public/js/cc-acceptui.js
// (function () {
//   let cfg = null;
//   let acceptLoaded = false;

//   function $(sel) { return document.querySelector(sel); }

//   function loadScript(src) {
//     return new Promise((res, rej) => {
//       if ([...document.scripts].some(s => s.src === src)) return res();
//       const el = document.createElement('script');
//       el.src = src;
//       el.onload = res;
//       el.onerror = rej;
//       document.head.appendChild(el);
//     });
//   }

//   async function fetchConfig() {
//     try {
//       const r = await fetch('/api/payments/config');
//       const j = await r.json();
//       if (j && j.success) return j.config;
//       console.warn('AcceptUI config unavailable:', j?.error || 'unknown');
//       return null;
//     } catch (e) {
//       console.error('AcceptUI config fetch failed:', e);
//       return null;
//     }
//   }

//   function renderButton(root, container) {
//     container.innerHTML =
//       '<button ' +
//       'class="AcceptUI primary-action-btn" ' +
//       'data-billingAddressOptions=\'{"show":true,"required":false}\' ' +
//       'data-apiLoginID="' + cfg.apiLoginId + '" ' +
//       'data-clientKey="' + cfg.clientKey + '" ' +
//       'data-paymentOptions=\'{"showCreditCard":true,"showBankAccount":false}\' ' +
//       'data-acceptUIFormBtnTxt="Pay Securely" ' +
//       'data-acceptUIFormHeaderTxt="Card Information" ' +
//       'data-responseHandler="acceptUIResponseHandler">' +
//       'Pay with Credit Card' +
//       '</button>';
//   }

//   async function charge(amount, description, opaqueData) {
//     const body = {
//       amount,
//       description,
//       opaqueData,
//       user_id: $('#ccRoot')?.dataset.userId || null,
//       plan_name: $('#ccRoot')?.dataset.selectedPlan || null
//     };
//     const r = await fetch('/api/payments/charge', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body)
//     });
//     return r.json();
//   }

//   function formatCurrency(v) {
//     const n = Number(v || 0);
//     return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
//   }

//   window.acceptUIResponseHandler = async function (response) {
//     try {
//       if (response?.messages?.resultCode !== 'Ok') {
//         const msg = response?.messages?.message?.[0]?.text || 'Payment form error';
//         // Show inline error instead of alert
//         const inlineError = document.getElementById('inlineError');
//         if (inlineError) {
//           inlineError.textContent = 'Payment form error: ' + msg;
//           inlineError.classList.remove('hidden');
//         }
//         return;
//       }

//       const opaqueData = response.opaqueData;
//       const amountEl = $('#amountInput');
//       const descEl = $('#descriptionInput');
//       const amount = Number((amountEl?.value || '0').replace(/[^0-9.]/g, ''));
//       const description = (descEl?.value || $('#ccRoot')?.dataset.selectedPlan || 'Gold Investment');

//       if (!amount || amount <= 0) {
//         const inlineError = document.getElementById('inlineError');
//         if (inlineError) {
//           inlineError.textContent = 'Please enter a valid amount';
//           inlineError.classList.remove('hidden');
//         }
//         return;
//       }

//       const btns = document.querySelectorAll('.AcceptUI, .primary-action-btn');
//       btns.forEach(b => { b.disabled = true; b.textContent = 'Processing...'; });

//       const res = await charge(amount, description, opaqueData);

//       if (res?.success) {
//         // Show success view
//         const successView = document.getElementById('successView');
//         const successAmount = document.getElementById('successAmount');
//         const successAccount = document.getElementById('successAccount');
//         const successDate = document.getElementById('successDate');

//         if (successAmount) successAmount.textContent = formatCurrency(amount);
//         if (successAccount) successAccount.textContent = 'Credit Card';
//         if (successDate) successDate.textContent = new Date().toLocaleDateString();

//         if (successView) {
//           successView.classList.remove('hidden');
//           // Hide primary action area
//           const primaryActionArea = document.getElementById('primaryActionArea');
//           if (primaryActionArea) primaryActionArea.style.display = 'none';
//         }
//       } else {
//         const inlineError = document.getElementById('inlineError');
//         if (inlineError) {
//           inlineError.textContent = 'Payment failed: ' + (res?.message || 'Unknown error');
//           inlineError.classList.remove('hidden');
//         }
//       }
//     } catch (err) {
//       console.error('AcceptUI handler error:', err);
//       const inlineError = document.getElementById('inlineError');
//       if (inlineError) {
//         inlineError.textContent = 'Payment processing failed. Please try again.';
//         inlineError.classList.remove('hidden');
//       }
//     } finally {
//       const btns = document.querySelectorAll('.AcceptUI, .primary-action-btn');
//       btns.forEach(b => { b.disabled = false; b.textContent = 'Pay with Credit Card'; });
//     }
//   };

//   document.addEventListener('DOMContentLoaded', async function () {
//     const root = document.getElementById('ccRoot');
//     const acceptContainer = document.getElementById('acceptUIContainer');
//     if (!root || !acceptContainer) return; // No-op if not present

//     cfg = await fetchConfig();
//     if (!cfg) {
//       // Dispatch event to notify that card form is not ready
//       window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
//       return;
//     }

//     const src = cfg.environment === 'production'
//       ? 'https://js.authorize.net/v3/AcceptUI.js'
//       : 'https://jstest.authorize.net/v3/AcceptUI.js';

//     try {
//       await loadScript(src);
//       acceptLoaded = true;
      
//       // Dispatch event to notify that card form is ready
//       window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: true } }));
      
//       // The button will be rendered dynamically by the main script when card method is selected
//     } catch (e) {
//       console.error('AcceptUI script load failed:', e);
//       // Dispatch event to notify that card form failed to load
//       window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
//     }
//   });
// })();


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
      'class="AcceptUI primary-action-btn" ' +
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

  // Function to add AcceptUI attributes to any button
  function addAcceptUIAttributes(button) {
    if (!cfg) return false;
    
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
        // Show inline error instead of alert
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
      const description = (descEl?.value || $('#ccRoot')?.dataset.selectedPlan || 'Gold Investment');

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
          // Hide primary action area
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

  document.addEventListener('DOMContentLoaded', async function () {
    const root = document.getElementById('ccRoot');
    const acceptContainer = document.getElementById('acceptUIContainer');
    if (!root || !acceptContainer) return; // No-op if not present

    cfg = await fetchConfig();
    if (!cfg) {
      // Dispatch event to notify that card form is not ready
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
      return;
    }

    // Make config available globally
    window.acceptUIConfig = cfg;

    const src = cfg.environment === 'production'
      ? 'https://js.authorize.net/v3/AcceptUI.js'
      : 'https://jstest.authorize.net/v3/AcceptUI.js';

    try {
      await loadScript(src);
      acceptLoaded = true;
      
      // Dispatch event to notify that card form is ready
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: true } }));
      
      // The button will be rendered dynamically by the main script when card method is selected
    } catch (e) {
      console.error('AcceptUI script load failed:', e);
      // Dispatch event to notify that card form failed to load
      window.dispatchEvent(new CustomEvent('acceptUIReady', { detail: { ready: false } }));
    }
  });

  // Expose the addAcceptUIAttributes function globally
  window.addAcceptUIAttributes = addAcceptUIAttributes;
})();
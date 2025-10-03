// src/routes/connect.js
const express = require("express");
const router = express.Router();
const cookie = require("cookie");

const LinkSession = require("../models/LinkSession");
const plaidService = require("../services/plaidService");

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return cookie.parse(header);
}

function renderPage({ linkToken, error, userId, selectedPlan }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Complete Your Purchase - Revelation Gold Group</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --rg-navy: #0f2547;
    --rg-navy-50: #f0f4f8;
    --rg-navy-600: #0a1f3a;
    --rg-ink: #0f2547;
    --rg-body: #64748b;
    --rg-border: #e2e8f0;
    --rg-card: #ffffff;
    --rg-gold: #d4af37;
  }
  
  * { 
    box-sizing: border-box; 
    margin: 0;
    padding: 0;
  }
  
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc; 
    color: var(--rg-body);
    line-height: 1.6;
    font-size: 15px;
  }
  
  .font-serif {
    font-family: 'Playfair Display', Georgia, serif;
  }
  
  .container { 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 48px 32px; 
  }
  
  .grid { 
    display: grid; 
    grid-template-columns: 7fr 5fr; 
    gap: 32px; 
  }
  
  .card { 
    background: var(--rg-card); 
    border: 1px solid var(--rg-border); 
    border-radius: 16px; 
    padding: 28px; 
    box-shadow: 0 6px 24px rgba(15, 39, 65, 0.06);
  }
  
  .sticky { 
    position: sticky; 
    top: 40px; 
  }
  
  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .logo {
    height: 60px;
    margin-bottom: 16px;
  }
  
  h1 { 
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px; 
    font-weight: 600; 
    color: var(--rg-ink); 
    margin: 0 0 8px; 
  }
  
  .subtitle { 
    color: var(--rg-body); 
    font-size: 15px; 
    margin-bottom: 32px; 
  }
  
  .section-title { 
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px; 
    font-weight: 600; 
    color: var(--rg-ink); 
    margin: 0 0 16px; 
  }
  
  .method-group { 
    margin-bottom: 32px; 
  }
  
  .method-option { 
    display: flex; 
    align-items: center; 
    padding: 20px; 
    border: 1px solid var(--rg-border); 
    border-radius: 12px; 
    margin-bottom: 12px; 
    cursor: pointer; 
    transition: all 0.2s ease;
    background: var(--rg-card);
  }
  
  .method-option:hover { 
    border-color: rgba(15, 39, 65, 0.3); 
  }
  
  .method-option.selected { 
    border-color: var(--rg-navy); 
    background: var(--rg-navy-50);
    box-shadow: 0 0 0 4px var(--rg-navy-50);
  }
  
  .method-option.disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }
  
  .method-radio { 
    margin-right: 16px; 
    width: 20px;
    height: 20px;
    accent-color: var(--rg-navy);
  }
  
  .method-content { 
    flex: 1; 
  }
  
  .method-title { 
    font-weight: 600; 
    color: var(--rg-ink); 
    margin: 0 0 4px; 
    font-size: 16px;
  }
  
  .method-desc { 
    font-size: 14px; 
    color: rgba(100, 116, 139, 0.7); 
    margin: 0; 
  }
  
  .method-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    color: var(--rg-navy);
  }
  
  .connect-btn { 
    width: 100%; 
    background: var(--rg-navy); 
    color: white; 
    border: none; 
    border-radius: 12px; 
    padding: 16px; 
    font-weight: 600; 
    font-size: 16px; 
    cursor: pointer; 
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(15, 39, 65, 0.18);
  }
  
  .connect-btn:hover { 
    background: var(--rg-navy-600); 
  }
  
  .connect-btn:focus { 
    outline: none; 
    box-shadow: 0 0 0 4px var(--rg-navy-50), 0 4px 14px rgba(15, 39, 65, 0.18);
  }
  
  .connect-btn:disabled { 
    background: #94a3b8; 
    cursor: not-allowed; 
    opacity: 0.6;
  }
  
  .connected-badge { 
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px; 
    background: #f0fdf4; 
    border: 1px solid #bbf7d0; 
    border-radius: 9999px; 
    margin-bottom: 24px; 
    font-size: 14px;
    font-weight: 500;
    color: #166534;
  }
  
  .connected-icon { 
    color: #059669; 
  }
  
  .connected-text { 
    flex: 1; 
  }
  
  .change-link { 
    color: var(--rg-navy); 
    text-decoration: none; 
    font-size: 14px; 
    font-weight: 500;
  }
  
  .change-link:hover {
    text-decoration: underline;
  }
  
  .form-group { 
    margin-bottom: 24px; 
  }
  
  .form-label { 
    display: block; 
    font-weight: 500; 
    color: var(--rg-ink); 
    margin-bottom: 8px; 
    font-size: 14px; 
  }
  
  .form-input { 
    width: 100%; 
    padding: 12px 16px; 
    border: 1px solid var(--rg-border); 
    border-radius: 8px; 
    font-size: 15px; 
    transition: all 0.2s ease;
    background: var(--rg-card);
  }
  
  .form-input:focus { 
    outline: none; 
    border-color: var(--rg-navy); 
    box-shadow: 0 0 0 3px var(--rg-navy-50); 
  }
  
  .form-input.error { 
    border-color: #dc2626; 
  }
  
  .form-select { 
    width: 100%; 
    padding: 12px 16px; 
    border: 1px solid var(--rg-border); 
    border-radius: 8px; 
    font-size: 15px; 
    background: var(--rg-card); 
    cursor: pointer; 
    transition: all 0.2s ease;
  }
  
  .form-select:focus { 
    outline: none; 
    border-color: var(--rg-navy); 
    box-shadow: 0 0 0 3px var(--rg-navy-50); 
  }
  
  .checkbox-group { 
    display: flex; 
    align-items: center; 
    margin-bottom: 32px; 
  }
  
  .checkbox { 
    margin-right: 12px; 
    width: 16px;
    height: 16px;
    accent-color: var(--rg-navy);
  }
  
  .checkbox-label { 
    font-size: 14px; 
    color: var(--rg-body); 
  }
  
  .review-row { 
    background: var(--rg-navy-50); 
    padding: 16px; 
    border-radius: 8px; 
    margin-bottom: 24px; 
    font-size: 14px; 
    color: var(--rg-ink);
    border: 1px solid var(--rg-border);
  }
  
  .pay-btn { 
    width: 100%; 
    background: var(--rg-navy); 
    color: white; 
    border: none; 
    border-radius: 12px; 
    padding: 16px; 
    font-weight: 600; 
    font-size: 16px; 
    cursor: pointer; 
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(15, 39, 65, 0.18);
  }
  
  .pay-btn:hover { 
    background: var(--rg-navy-600); 
  }
  
  .pay-btn:focus { 
    outline: none; 
    box-shadow: 0 0 0 4px var(--rg-navy-50), 0 4px 14px rgba(15, 39, 65, 0.18);
  }
  
  .pay-btn:disabled { 
    background: #94a3b8; 
    cursor: not-allowed; 
    opacity: 0.6;
  }
  
  .success-view { 
    text-align: center; 
    padding: 48px 24px; 
  }
  
  .success-icon { 
    color: var(--rg-gold); 
    font-size: 48px; 
    margin-bottom: 16px; 
  }
  
  .success-title { 
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px; 
    font-weight: 600; 
    color: var(--rg-ink); 
    margin: 0 0 16px; 
  }
  
  .success-details { 
    color: var(--rg-body); 
    margin-bottom: 32px; 
    font-size: 15px;
  }
  
  .success-details div {
    margin-bottom: 8px;
  }
  
  .success-actions { 
    display: flex; 
    gap: 12px; 
    justify-content: center; 
  }
  
  .btn-primary { 
    background: var(--rg-navy); 
    color: white; 
    border: none; 
    border-radius: 8px; 
    padding: 12px 24px; 
    font-weight: 500; 
    cursor: pointer; 
    text-decoration: none; 
    display: inline-block; 
    transition: all 0.2s ease;
  }
  
  .btn-primary:hover {
    background: var(--rg-navy-600);
  }
  
  .btn-secondary { 
    background: white; 
    color: var(--rg-navy); 
    border: 1px solid var(--rg-border); 
    border-radius: 8px; 
    padding: 12px 24px; 
    font-weight: 500; 
    cursor: pointer; 
    text-decoration: none; 
    display: inline-block; 
    transition: all 0.2s ease;
  }
  
  .btn-secondary:hover {
    background: var(--rg-navy-50);
  }
  
  .order-summary { 
    background: var(--rg-card); 
    border: 1px solid var(--rg-border); 
    border-radius: 16px; 
    padding: 24px; 
  }
  
  .order-title { 
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px; 
    font-weight: 600; 
    color: var(--rg-ink); 
    margin: 0 0 20px; 
  }
  
  .order-item { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 12px; 
    font-size: 14px; 
    padding-bottom: 12px;
    border-bottom: 1px solid var(--rg-border);
  }
  
  .order-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .order-item.total { 
    font-weight: 600; 
    font-size: 16px; 
    color: var(--rg-ink);
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--rg-border);
  }
  
  .trust-row { 
    display: flex; 
    align-items: center; 
    margin-top: 20px; 
    padding-top: 20px; 
    border-top: 1px solid var(--rg-border); 
    font-size: 12px; 
    color: var(--rg-body); 
  }
  
  .trust-icon { 
    margin-right: 8px; 
    color: var(--rg-gold); 
  }
  
  .trust-row a {
    color: var(--rg-navy);
    text-decoration: none;
  }
  
  .trust-row a:hover {
    text-decoration: underline;
  }
  
  .error-message { 
    color: #dc2626; 
    font-size: 13px; 
    margin-top: 4px; 
  }
  
  .loading { 
    opacity: 0.6; 
    pointer-events: none; 
  }
  
  .hidden { 
    display: none; 
  }
  
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .grid { 
      grid-template-columns: 1fr; 
    }
    .sticky { 
      position: static; 
    }
    .container {
      padding: 24px 16px;
    }
  }
</style>
<script src="/js/cc-acceptui.js" defer></script>
</head>
<body>
  <div class="container">
    <div class="grid">
      <!-- Left Column: Payment Flow -->
      <div class="main-content">
  <div class="card">
          <!-- Company Logo and Header -->
          <div class="header">
            <img src="/logo.png" alt="Revelation Gold Group" class="logo" onerror="this.style.display='none'">
            <h1 class="font-serif">Complete your purchase</h1>
            <p class="subtitle">Securely connect your bank account to complete your gold purchase</p>
          </div>
          
    ${
      error
        ? `
            <div style="color: #dc2626; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 24px;">
              <strong>Error:</strong> ${error}
            </div>
            <p><a href="/" style="color: var(--rg-navy);">← Start over</a></p>
          `
              : `
          <!-- Payment Method Selection -->
          <div class="method-group">
            <div class="section-title">Payment method</div>
            <div class="method-option selected" data-method="bank">
              <input type="radio" name="payment-method" value="bank" class="method-radio" checked>
              <div class="method-icon">🏦</div>
              <div class="method-content">
                <div class="method-title">Bank account (Plaid)</div>
                <div class="method-desc">Connect your bank account securely</div>
              </div>
            </div>
            <div class="method-option" data-method="card">
  <input type="radio" name="payment-method" value="card" class="method-radio">
  <div class="method-icon">💳</div>
  <div class="method-content">
    <div class="method-title">Credit/Debit card</div>
    <div class="method-desc">Pay instantly with your credit or debit card</div>
  </div>
</div>
          </div>

          <!-- Bank Connection Section -->
          <div id="bankSection">
            <button id="connectBtn" class="connect-btn">
              Connect bank account
            </button>
            
            <div id="connectedBadge" class="connected-badge hidden">
              <div class="connected-icon">✓</div>
              <div class="connected-text" id="connectedText">Bank connected</div>
              <a href="#" id="changeBankLink" class="change-link">Change</a>
            </div>
          </div>

          <!-- Payment Details (shown after bank connection) -->
          <div id="paymentDetails" class="hidden">
            <div class="section-title">Payment details</div>
            
            <div class="form-group">
              <label class="form-label" for="accountSelect">Account</label>
              <select id="accountSelect" class="form-select" required>
                <option value="">Choose an account...</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="amountInput">Amount</label>
              <input 
                type="text" 
                id="amountInput" 
                class="form-input" 
                placeholder="0.00" 
                inputmode="decimal"
                required
              >
              <div id="amountError" class="error-message hidden">Please enter a valid amount</div>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="descriptionInput">Investment Plan</label>
              <input 
                type="text" 
                id="descriptionInput" 
                class="form-input" 
                placeholder="Plan will be auto-selected"
                readonly
                style="background-color: #f8fafc; cursor: not-allowed;"
              >
            </div>
            
            <div id="reviewRow" class="review-row hidden">
              <div>Pay <span id="reviewAmount">$0.00</span> from <span id="reviewAccount">Account</span></div>
            </div>
            
            <button id="payBtn" class="pay-btn" disabled>
              Complete payment
            </button>
          </div>

          <!-- Success View (shown after successful payment) -->
          <div id="successView" class="success-view hidden">
            <div class="success-icon">✓</div>
            <h2 class="success-title">Payment successful</h2>
            <div class="success-details">
              <div>Amount: <span id="successAmount">$0.00</span></div>
              <div>Account: <span id="successAccount">Account</span></div>
              <div>Date: <span id="successDate">Date</span></div>
            </div>
            <div class="success-actions">
              <button id="newPaymentBtn" class="btn-primary">New payment</button>
            </div>
          </div>

          <!-- AcceptUI context (passes server values safely to frontend) -->
          <div id="ccRoot" data-user-id="${userId || ''}" data-selected-plan="${selectedPlan || ''}"></div>

          <!-- Credit Card Section (kept hidden unless you show it for testing) -->
          <div id="cardSection">
            <div class="section-title">Card Payment</div>

            <div class="form-group">
              <label class="form-label" for="ccAmount">Amount</label>
              <input type="text" id="ccAmount" class="form-input" placeholder="0.00" inputmode="decimal">
            </div>

            <div class="form-group">
              <label class="form-label" for="ccDescription">Description (optional)</label>
              <input type="text" id="ccDescription" class="form-input" placeholder="Gold Investment Plan">
            </div>

            <div class="cc-status" style="margin:8px 0; color:#64748b;">Loading secure payment form…</div>
            <div id="acceptUIContainer"></div>
          </div>
          `
          }
        </div>
      </div>

      <!-- Right Column: Order Summary -->
      <div class="sticky">
        <div class="order-summary">
          <h3 class="order-title">Order summary</h3>
          
          <div class="order-item">
            <span>Gold Investment Plan</span>
            <span id="orderAmount">$0.00</span>
          </div>
          
          <div class="order-item">
            <span>Processing fee</span>
            <span>$0.00</span>
          </div>
          
          <div class="order-item total">
            <span>Total</span>
            <span id="orderTotal">$0.00</span>
          </div>
          
          <div class="trust-row">
            <div class="trust-icon">🔒</div>
            <div>
              Bank connection is secure via Plaid. 
              <a href="/terms">Terms</a> • 
              <a href="/privacy">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  ${
    linkToken
      ? `
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    (function () {
      // ----- Boot vars from server -----
      var USER_ID      = ${JSON.stringify(userId ?? null)};
      var linkToken    = ${JSON.stringify(linkToken)};
      var selectedPlan = ${JSON.stringify(selectedPlan || '')};

      // ----- State (bank only; card handled locally) -----
      var state = {
        isConnected: false,
        accounts: [],
        selectedAccountId: null,
        amount: 0,
        description: ''
      };

      // ----- DOM helpers -----
      function $(sel) { return document.querySelector(sel); }
      function $all(sel) { return document.querySelectorAll(sel); }

      // ----- Formatting helpers -----
      function parseAmount(v) {
        if (!v) return 0;
        var cleaned = String(v).replace(/[^0-9.]/g, '');
        if (!cleaned) return 0;
        var parts = cleaned.split('.');
        if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
        if (parts[1] && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
        return parseFloat(cleaned) || 0;
      }
      function fmtUsd(n) { return '$' + (Number(n || 0).toFixed(2)); }

      // ----- Order summary sync -----
      function setSummaryFromActive() {
        var method = document.querySelector('input[name="payment-method"]:checked')?.value || 'bank';
        var amt = method === 'card' ? parseAmount($('#ccAmount')?.value) : parseAmount($('#amountInput')?.value);
        var orderAmount = $('#orderAmount');
        var orderTotal  = $('#orderTotal');
        if (orderAmount) orderAmount.textContent = fmtUsd(amt);
        if (orderTotal)  orderTotal.textContent  = fmtUsd(amt);
      }

      // =======================================================================
      // Payment method UI (tabs) + AcceptUI lazy loading
      // =======================================================================

      var methodRadios = $all('input[name="payment-method"]');
      var bankSection  = $('#bankSection');
      var cardSection  = $('#cardSection');
      var connectBtn   = $('#connectBtn');
      var bankAmountEl = $('#amountInput');
      var cardAmountEl = $('#ccAmount');

      // AcceptUI config/script state
      var paymentConfig   = null;
      var acceptUILoaded  = false;
      var configRequested = false;

      function disableCardOption(msg) {
        var cardOption = document.querySelector('.method-option[data-method="card"]');
        if (!cardOption) return;
        cardOption.classList.add('disabled');
        var radio = cardOption.querySelector('input[type="radio"]');
        if (radio) radio.disabled = true;
        var desc = cardOption.querySelector('.method-desc');
        if (desc && msg) desc.textContent = msg;
      }

      function loadScript(src) {
        return new Promise(function (resolve, reject) {
          if ([...document.scripts].some(function (s) { return s.src === src; })) return resolve();
          var el = document.createElement('script');
          el.src = src;
          el.onload = resolve;
          el.onerror = reject;
          document.head.appendChild(el);
        });
      }

      function gateButtons() {
        var active = document.querySelector('input[name="payment-method"]:checked')?.value || 'bank';
        var bankAmt = parseAmount(bankAmountEl?.value);
        var cardAmt = parseAmount(cardAmountEl?.value);
        if (connectBtn) connectBtn.disabled = !(active === 'bank' && bankAmt > 0);
        var acceptBtn = document.querySelector('.AcceptUI.pay-btn');
        if (acceptBtn) acceptBtn.disabled = !(active === 'card' && cardAmt > 0);
      }

      function createAcceptUIButton() {
        var container = $('#acceptUIContainer');
        if (!container || !paymentConfig || !window.Accept) return;

        container.innerHTML =
          '<button ' +
          'class="AcceptUI pay-btn" ' +
          'data-billingAddressOptions=\'{"show":true,"required":false}\' ' +
          'data-apiLoginID="' + paymentConfig.apiLoginId + '" ' +
          'data-clientKey="' + paymentConfig.clientKey + '" ' +
          'data-paymentOptions=\'{"showCreditCard":true,"showBankAccount":false}\' ' +
          'data-acceptUIFormBtnTxt="Pay Securely" ' +
          'data-acceptUIFormHeaderTxt="Card Information" ' +
          'data-responseHandler="acceptUIResponseHandler" ' +
          'disabled>' +
          'Pay with Credit Card' +
          '</button>';

        gateButtons();
      }

      async function ensureCardReady() {
        if (acceptUILoaded) return;
        if (configRequested) return;
        configRequested = true;

        try {
          var r = await fetch('/api/payments/config');
          var j = await r.json();
          if (!j.success) {
            disableCardOption('Card temporarily unavailable');
            return;
          }
          paymentConfig = j.config;
          var src = paymentConfig.environment === 'production'
            ? 'https://js.authorize.net/v3/AcceptUI.js'
            : 'https://jstest.authorize.net/v3/AcceptUI.js';
          await loadScript(src);
          acceptUILoaded = true;
          createAcceptUIButton();
        } catch (e) {
          disableCardOption('Unable to load card form');
        }
      }

      function applyMethodUI() {
        var active = document.querySelector('input[name="payment-method"]:checked')?.value || 'bank';

        // visual selected card
        $all('.method-option').forEach(function (opt) { opt.classList.remove('selected'); });
        var card = document.querySelector('.method-option[data-method="' + active + '"]');
        if (card) card.classList.add('selected');

        if (active === 'bank') {
          if (bankSection) bankSection.classList.remove('hidden');
          if (cardSection) cardSection.classList.add('hidden');
        } else {
          if (cardSection) cardSection.classList.remove('hidden');
          if (bankSection) bankSection.classList.add('hidden');
          ensureCardReady();
        }
        setSummaryFromActive();
        gateButtons();
      }

      methodRadios.forEach(function (radio) {
        radio.addEventListener('change', applyMethodUI);
      });

      if (bankAmountEl) {
        bankAmountEl.addEventListener('input', function () { setSummaryFromActive(); gateButtons(); });
        bankAmountEl.addEventListener('blur',  function () {
          var v = parseAmount(this.value);
          if (v > 0) this.value = v.toFixed(2);
        });
      }
      if (cardAmountEl) {
        cardAmountEl.addEventListener('input', function () { setSummaryFromActive(); gateButtons(); });
        cardAmountEl.addEventListener('blur',  function () {
          var v = parseAmount(this.value);
          if (v > 0) this.value = v.toFixed(2);
        });
      }

      // Initial UI setup
      applyMethodUI();
      setSummaryFromActive();
      gateButtons();

      // =======================================================================
      // AcceptUI response handler (backend charge call)
      // =======================================================================
      window.acceptUIResponseHandler = async function (response) {
        try {
          if (response?.messages?.resultCode !== 'Ok') {
            var msg = response?.messages?.message?.[0]?.text || 'Payment form error';
            alert('Payment form error: ' + msg);
            return;
          }
          var opaqueData   = response.opaqueData;
          var amount       = parseAmount($('#ccAmount')?.value);
          var description  = ($('#ccDescription')?.value || selectedPlan || 'Gold Investment Plan');

          if (!(amount > 0)) {
            alert('Please enter a valid amount');
            return;
          }

          // disable buttons during charge
          $all('.AcceptUI.pay-btn, .pay-btn').forEach(function (b) { b.disabled = true; b.textContent = 'Processing…'; });

          var res = await fetch('/api/payments/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amount,
              description: description,
              opaqueData: opaqueData,
              user_id: USER_ID,
              plan_name: selectedPlan || null
            })
          }).then(function (r) { return r.json(); });

          if (res?.success) {
            // success screen
            state.isConnected = false;
            var successView    = $('#successView');
            var paymentDetails = $('#paymentDetails');
            if (paymentDetails) paymentDetails.classList.add('hidden');
            if (bankSection) bankSection.classList.add('hidden');
            if (cardSection) cardSection.classList.add('hidden');

            if ($('#successAmount'))  $('#successAmount').textContent = fmtUsd(amount);
            if ($('#successAccount')) $('#successAccount').textContent = 'Credit Card';
            if ($('#successDate'))    $('#successDate').textContent = new Date().toLocaleDateString();
            if (successView) successView.classList.remove('hidden');
          } else {
            alert('Payment failed: ' + (res?.message || 'Unknown error'));
          }
        } catch (e) {
          alert('Payment processing failed. Please try again.');
        } finally {
          // re-enable
          $all('.AcceptUI.pay-btn, .pay-btn').forEach(function (b) { b.disabled = false; b.textContent = 'Pay with Credit Card'; });
          gateButtons();
        }
      };

      // =======================================================================
      // Bank (Plaid) flow — existing behavior retained
      // =======================================================================

      function getSelectedAccount() {
        if (!state.selectedAccountId || state.accounts.length === 0) return null;
        return state.accounts.find(function (acc) { return acc.id === state.selectedAccountId; });
      }
      function updateConnectedBadge() {
        var selected = getSelectedAccount();
        var connectedText = $('#connectedText');
        if (connectedText && selected) {
          var name = selected.name || selected.official_name || selected.subtype || 'Account';
          connectedText.textContent = 'Connected — ' + name + ' ••••' + selected.mask;
        }
      }
      function updateReviewRow() {
        var reviewRow    = $('#reviewRow');
        var reviewAmount = $('#reviewAmount');
        var reviewAccount= $('#reviewAccount');
        var selected     = getSelectedAccount();
        if (state.amount > 0 && selected) {
          if (reviewRow)    reviewRow.classList.remove('hidden');
          if (reviewAmount) reviewAmount.textContent = fmtUsd(state.amount);
          if (reviewAccount) {
            var name = selected.name || selected.official_name || selected.subtype || 'Account';
            reviewAccount.textContent = name + ' ••••' + selected.mask;
          }
        } else {
          if (reviewRow) reviewRow.classList.add('hidden');
        }
      }

      if (selectedPlan) {
        var descInput = $('#descriptionInput');
        if (descInput) {
          descInput.value = selectedPlan;
          state.description = selectedPlan;
        }
      }

      // Initialize Plaid Link
      var handler = Plaid.create({
        token: linkToken,
        onSuccess: function (public_token, metadata) {
          fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token: public_token, user_id: USER_ID })
          })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.success) {
              state.isConnected = true;
              state.accounts    = data.accounts || [];
              if (state.selectedAccountId === null && state.accounts.length > 0) {
                state.selectedAccountId = state.accounts[0].id;
              }
              // populate account dropdown
              var accountSelect = $('#accountSelect');
              if (accountSelect) {
                accountSelect.innerHTML = '<option value="">Choose an account...</option>';
                state.accounts.forEach(function (a) {
                  var opt    = document.createElement('option');
                  opt.value  = a.id;
                  opt.textContent = (a.name + ' (' + a.type + ') ••••' + a.mask);
                  accountSelect.appendChild(opt);
                });
                accountSelect.value = state.selectedAccountId;
              }
              $('#connectedBadge')?.classList.remove('hidden');
              $('#paymentDetails')?.classList.remove('hidden');
              updateConnectedBadge();
            } else {
              alert('Bank connection failed: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(function () { alert('Bank connection failed. Please try again.'); });
        },
        onExit: function (err, metadata) { /* no-op */ }
      });

      document.addEventListener('DOMContentLoaded', function () {
        // connect button
        if (connectBtn) {
          connectBtn.addEventListener('click', function () {
            handler.open();
          });
        }
        // account select
        var accountSelect = $('#accountSelect');
        if (accountSelect) {
          accountSelect.addEventListener('change', function () {
            state.selectedAccountId = this.value;
            updateConnectedBadge(); updateReviewRow();
          });
        }
        // bank amount input
        if (bankAmountEl) {
          bankAmountEl.addEventListener('input', function () {
            state.amount = parseAmount(this.value);
            setSummaryFromActive();
            updateReviewRow();
            gateButtons();
          });
          bankAmountEl.addEventListener('blur', function () {
            if (state.amount > 0) this.value = state.amount.toFixed(2);
          });
        }
        // description input
        var descriptionInput = $('#descriptionInput');
        if (descriptionInput) {
          descriptionInput.addEventListener('input', function () {
            state.description = this.value;
            updateReviewRow();
          });
        }
        // pay (ACH) button
        var payBtn = $('#payBtn');
        if (payBtn) {
          payBtn.addEventListener('click', function () {
            if (!(state.isConnected && state.selectedAccountId && state.amount > 0)) return;
            payBtn.disabled = true;
            payBtn.innerHTML = '<span class="spinner"></span>Processing...';
            var description = state.description || 'Gold purchase';

            fetch('/api/transfers/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: USER_ID,
                account_id: state.selectedAccountId,
                amount: state.amount,
                description: description
              })
            })
            .then(function (r) { return r.json(); })
            .then(function (result) {
              if (result.success) {
                var successView = $('#successView');
                if ($('#successAmount'))  $('#successAmount').textContent = fmtUsd(state.amount);
                if ($('#successAccount')) $('#successAccount').textContent =
                  (getSelectedAccount()?.name || 'Account') + ' ••••' + (getSelectedAccount()?.mask || '****');
                if ($('#successDate'))    $('#successDate').textContent = new Date().toLocaleDateString();
                // hide sections, show success
                if (bankSection) bankSection.classList.add('hidden');
                if (cardSection) cardSection.classList.add('hidden');
                if (successView) successView.classList.remove('hidden');
              } else {
                alert('Payment failed: ' + (result.error || 'Unknown error'));
              }
            })
            .catch(function () { alert('Payment failed. Please try again.'); })
            .finally(function () {
              payBtn.disabled = false;
              payBtn.textContent = 'Complete payment';
            });
          });
        }

        // new payment resets
        var newPaymentBtn = $('#newPaymentBtn');
        if (newPaymentBtn) {
          newPaymentBtn.addEventListener('click', function () {
            state.isConnected = false;
            state.accounts = [];
            state.selectedAccountId = null;
            state.amount = 0;
            state.description = '';
            if (bankAmountEl) bankAmountEl.value = '';
            if ($('#descriptionInput')) $('#descriptionInput').value = selectedPlan || '';
            if ($('#accountSelect')) $('#accountSelect').innerHTML = '<option value="">Choose an account...</option>';
            $('#successView')?.classList.add('hidden');
            // default back to bank tab
            var bankRadio = document.querySelector('input[name="payment-method"][value="bank"]');
            if (bankRadio) bankRadio.checked = true;
            applyMethodUI(); setSummaryFromActive(); gateButtons();
          });
        }
      });
    })();
  </script>
  `
      : ""
  }
</body>
</html>`;
}

router.get("/", async (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const sessionId = cookies["rg_link_session"];
    const { selected_plan } = req.query;
    
    // DEBUG: Log the URL parameters
    console.log('🔍 DEBUG: req.query =', req.query);
    console.log('🔍 DEBUG: selected_plan =', selected_plan);

    if (!sessionId) {
      return res.status(200).send(
        renderPage({
          linkToken: null,
          error: "Your session expired. Please start again.",
          userId: null,
          selectedPlan: selected_plan || null
        })
      );
    }

    const session = await LinkSession.getById(sessionId);
    const now = new Date();

    if (!session || session.used || new Date(session.expires_at) < now) {
      return res.status(200).send(
        renderPage({
          linkToken: null,
          error: "Your session expired. Please start again.",
          userId: null,
          selectedPlan: selected_plan || null
        })
      );
    }

    // Issue a new link_token for THIS user
    const linkToken = await plaidService.createLinkToken({
      userId: session.user_id,
      products: ["auth", "transfer"],
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    });

    // (Optional) Only mark used after link token creation succeeds
    await LinkSession.markUsed(session.id);

    return res.status(200).send(renderPage({ 
        linkToken,
        error: null,
        userId: session.user_id,
      selectedPlan: selected_plan || null
    }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
console.log("Connect route loaded");
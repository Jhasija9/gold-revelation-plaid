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
  
  /* AcceptUI Button Styling */
.AcceptUI {
  width: 100% !important;
  background: var(--rg-navy) !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  padding: 16px !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 4px 14px rgba(15, 39, 65, 0.18) !important;
}

.AcceptUI:hover {
  background: var(--rg-navy-600) !important;
}

.AcceptUI:disabled {
  background: #94a3b8 !important;
  cursor: not-allowed !important;
  opacity: 0.6 !important;
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
                <div class="method-desc">Pay with your credit or debit card</div>
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

          <!-- Credit Card Section with AcceptUI -->
          <div id="cardSection" class="hidden">
            <div class="section-title">Card Payment</div>
            
            <div class="form-group">
              <label class="form-label" for="cardAmount">Amount</label>
              <input 
                type="text" 
                id="cardAmount" 
                class="form-input" 
                placeholder="0.00" 
                inputmode="decimal"
                required
              >
            </div>
            
            <div class="form-group">
              <label class="form-label" for="cardDescription">Description (optional)</label>
              <input 
                type="text" 
                id="cardDescription" 
                class="form-input" 
                placeholder="Gold Investment Plan"
              >
            </div>
            
            <!-- AcceptUI Button Container -->
            <div id="acceptUIContainer">
              <button id="acceptUIButton" class="pay-btn" disabled>
                Loading secure payment form...
              </button>
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
    (function(){
      var USER_ID = ${JSON.stringify(userId ?? null)};
      var linkToken = ${JSON.stringify(linkToken)};
      var selectedPlan = ${JSON.stringify(selectedPlan || '')};
      
      console.log('🔍 DEBUG: selectedPlan variable =', selectedPlan);
      console.log('🔍 DEBUG: selectedPlan type =', typeof selectedPlan);
      console.log('🔍 DEBUG: selectedPlan length =', selectedPlan ? selectedPlan.length : 'null/undefined');
      
      // AcceptUI Integration Variables
      let paymentConfig = null;
      let acceptUILoaded = false;
      
      // State management - single source of truth
      var state = {
        isConnected: false,
        isSubmitting: false,
        currentStep: 'connect', // connect, details, success
        accounts: [], // Array of account objects
        selectedAccountId: null, // Currently selected account ID
        amount: 0, // Amount as decimal number
        description: ''
      };
      
      // Get currently selected account
      function getSelectedAccount() {
        if (!state.selectedAccountId || state.accounts.length === 0) return null;
        return state.accounts.find(function(acc) {
          return acc.id === state.selectedAccountId;
        });
      }
      
      // Update connected badge text based on selected account
      function updateConnectedBadge() {
        var selected = getSelectedAccount();
        var connectedText = document.getElementById('connectedText');
        if (connectedText && selected) {
          var accountName = selected.name || selected.official_name || selected.subtype || 'Account';
          connectedText.textContent = 'Connected — ' + accountName + ' ••••' + selected.mask;
        }
      }
      
      // Format amount for display
      function formatAmount(amount) {
        return amount.toFixed(2);
      }
      
      // Parse amount input to decimal
      function parseAmount(value) {
        if (!value || value.trim() === '') return 0;
        
        // Remove any non-numeric characters except decimal point
        var cleaned = value.replace(/[^0-9.]/g, '');
        if (cleaned === '') return 0;
        
        // Ensure only one decimal point
        var parts = cleaned.split('.');
        if (parts.length > 2) {
          cleaned = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
          cleaned = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        return parseFloat(cleaned) || 0;
      }
      
      // State management
      function updateUI() {
        var connectBtn = document.getElementById('connectBtn');
        var connectedBadge = document.getElementById('connectedBadge');
        var paymentDetails = document.getElementById('paymentDetails');
        var successView = document.getElementById('successView');
        
        // Hide all sections first
        if (connectBtn) connectBtn.classList.add('hidden');
        if (connectedBadge) connectedBadge.classList.add('hidden');
        if (paymentDetails) paymentDetails.classList.add('hidden');
        if (successView) successView.classList.add('hidden');
        
        // Show appropriate section based on step
        if (state.currentStep === 'connect') {
          if (connectBtn) connectBtn.classList.remove('hidden');
        } else if (state.currentStep === 'details') {
          if (connectedBadge) connectedBadge.classList.remove('hidden');
          if (paymentDetails) paymentDetails.classList.remove('hidden');
        } else if (state.currentStep === 'success') {
          if (successView) successView.classList.remove('hidden');
        }
      }
      
      // Currency formatting for display
      function formatCurrency(value) {
        return '$' + value.toFixed(2);
      }
      
      // Update order summary for both payment methods
      function updateOrderSummary() {
        var orderAmount = document.getElementById('orderAmount');
        var orderTotal = document.getElementById('orderTotal');
        
        var amount = 0;
        
        // Check which payment method is selected
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        if (selectedMethod && selectedMethod.value === 'card') {
          const cardAmountInput = document.getElementById('cardAmount');
          if (cardAmountInput) {
            amount = parseAmount(cardAmountInput.value);
          }
        } else {
          amount = state.amount; // Bank transfer amount
        }
        
        var formattedAmount = formatCurrency(amount);
        
        if (orderAmount) orderAmount.textContent = formattedAmount;
        if (orderTotal) orderTotal.textContent = formattedAmount;
      }
      
      // Validate form
      function validateForm() {
        var payBtn = document.getElementById('payBtn');
        var isValid = state.isConnected && 
                     state.selectedAccountId && 
                     state.amount > 0;
        
        if (payBtn) {
          payBtn.disabled = !isValid;
        }
        
        return isValid;
      }
      
      // Validate card form
      function validateCardForm() {
        const cardAmountInput = document.getElementById('cardAmount');
        const acceptUIBtn = document.querySelector('.AcceptUI');
        
        if (cardAmountInput && acceptUIBtn) {
          const amount = parseAmount(cardAmountInput.value);
          acceptUIBtn.disabled = amount <= 0;
        }
      }
      
      // Update review row
      function updateReviewRow() {
        var reviewRow = document.getElementById('reviewRow');
        var reviewAmount = document.getElementById('reviewAmount');
        var reviewAccount = document.getElementById('reviewAccount');
        
        var selected = getSelectedAccount();
        
        if (state.amount > 0 && selected) {
          if (reviewRow) reviewRow.classList.remove('hidden');
          if (reviewAmount) reviewAmount.textContent = formatCurrency(state.amount);
          if (reviewAccount) {
            var accountName = selected.name || selected.official_name || selected.subtype || 'Account';
            reviewAccount.textContent = accountName + ' ••••' + selected.mask;
          }
        } else {
          if (reviewRow) reviewRow.classList.add('hidden');
        }
      }
      
      // Load payment configuration
      async function loadPaymentConfig() {
        try {
          const response = await fetch('/api/payments/config');
          const result = await response.json();
          
          if (result.success) {
            paymentConfig = result.config;
            console.log('💳 Payment config loaded:', paymentConfig);
            loadAcceptUI();
          } else {
            console.warn('⚠️ Credit card payments unavailable:', result.error);
            // Disable credit card option
            const cardOption = document.querySelector('.method-option[data-method="card"]');
            if (cardOption) {
              cardOption.classList.add('disabled');
              cardOption.querySelector('.method-desc').textContent = 'Currently unavailable';
              const radio = cardOption.querySelector('input[type="radio"]');
              if (radio) radio.disabled = true;
            }
          }
        } catch (error) {
          console.error('Error loading payment config:', error);
        }
      }
      
      // Load AcceptUI script dynamically
      function loadAcceptUI() {
        if (!paymentConfig || acceptUILoaded) return;
        
        const scriptUrl = paymentConfig.environment === 'production' 
          ? 'https://js.authorize.net/v3/AcceptUI.js'
          : 'https://jstest.authorize.net/v3/AcceptUI.js';
          
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.onload = function() {
          acceptUILoaded = true;
          console.log('✅ AcceptUI loaded');
          initializeAcceptUI();
        };
        script.onerror = function() {
          console.error('❌ Failed to load AcceptUI');
        };
        document.head.appendChild(script);
      }
      
      // Initialize AcceptUI button
      function initializeAcceptUI() {
        if (!paymentConfig || !window.Accept) return;
        
        const container = document.getElementById('acceptUIContainer');
        if (!container) return;
        
        // Create AcceptUI button with data attributes
        container.innerHTML = \`
          <button 
            class="AcceptUI pay-btn" 
            data-billingAddressOptions='{"show":true, "required":false}'
            data-apiLoginID="\${paymentConfig.apiLoginId}"
            data-clientKey="\${paymentConfig.clientKey}"
            data-paymentOptions='{"showCreditCard": true, "showBankAccount": false}'
            data-acceptUIFormBtnTxt="Pay Securely"
            data-acceptUIFormHeaderTxt="Card Information"
            data-responseHandler="acceptUIResponseHandler"
            disabled
          >
            Pay with Credit Card
          </button>
        \`;
        
        console.log('✅ AcceptUI button initialized');
        validateCardForm(); // Enable button if amount is valid
      }
      
      // Global response handler for AcceptUI
      window.acceptUIResponseHandler = function(response) {
        console.log('💳 AcceptUI Response:', response);
        
        if (response.messages.resultCode === "Ok") {
          const opaqueData = response.opaqueData;
          console.log('✅ Got opaqueData:', opaqueData.dataDescriptor);
          
          // Process the payment
          processCardPayment(opaqueData);
        } else {
          console.error('❌ AcceptUI Error:', response.messages);
          alert('Payment form error: ' + response.messages.message[0].text);
        }
      };
      
      // Process card payment with opaqueData
      async function processCardPayment(opaqueData) {
        const cardAmountInput = document.getElementById('cardAmount');
        const cardDescriptionInput = document.getElementById('cardDescription');
        
        const amount = parseAmount(cardAmountInput.value);
        const description = cardDescriptionInput.value || selectedPlan || 'Gold Investment Plan';
        
        if (amount <= 0) {
          alert('Please enter a valid amount');
          return;
        }
        
        try {
          // Disable all buttons during processing
          const buttons = document.querySelectorAll('.AcceptUI, .pay-btn');
          buttons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Processing payment...';
          });
          
          const response = await fetch('/api/payments/charge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: amount,
              description: description,
              opaqueData: opaqueData,
              user_id: USER_ID,
              plan_name: selectedPlan
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Show success
            showCardPaymentSuccess({
              amount: amount,
              transactionId: result.transactionId,
              authCode: result.authCode,
              description: description
            });
          } else {
            console.error('❌ Payment failed:', result);
            alert('Payment failed: ' + result.message);
            
            // Re-enable buttons
            buttons.forEach(btn => {
              btn.disabled = false;
              btn.textContent = 'Pay with Credit Card';
            });
            validateCardForm(); // Re-validate form
          }
        } catch (error) {
          console.error('❌ Payment processing error:', error);
          alert('Payment processing failed. Please try again.');
          
          // Re-enable buttons
          const buttons = document.querySelectorAll('.AcceptUI, .pay-btn');
          buttons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Pay with Credit Card';
          });
          validateCardForm(); // Re-validate form
        }
      }
      
      // Show success for card payments
      function showCardPaymentSuccess(paymentData) {
        state.currentStep = 'success';
        
        const successAmount = document.getElementById('successAmount');
        const successAccount = document.getElementById('successAccount');
        const successDate = document.getElementById('successDate');
        
        if (successAmount) successAmount.textContent = formatCurrency(paymentData.amount);
        if (successAccount) successAccount.textContent = 'Credit Card •••• ' + (paymentData.authCode || '****');
        if (successDate) successDate.textContent = new Date().toLocaleDateString();
        
        updateUI();
      }
      
      // Initialize Plaid Link
      var handler = Plaid.create({
        token: linkToken,
        onSuccess: function(public_token, metadata) {
          console.log('Plaid Link success:', public_token, metadata);
          
          // Exchange token
          fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_token: public_token,
              user_id: USER_ID
            })
          })
          .then(response => response.json())
          .then(data => {
            console.log('Exchange result:', data);
            if (data.success) {
              state.isConnected = true;
              state.accounts = data.accounts;
              
              // Initialize selectedAccountId only if null
              if (state.selectedAccountId === null && data.accounts.length > 0) {
                state.selectedAccountId = data.accounts[0].id;
              }
              
              state.currentStep = 'details';
              
              // Populate account dropdown
              var accountSelect = document.getElementById('accountSelect');
              if (accountSelect && state.accounts.length > 0) {
                accountSelect.innerHTML = '<option value="">Choose an account...</option>';
                state.accounts.forEach(function(account) {
                  var option = document.createElement('option');
                  option.value = account.id;
                  option.textContent = account.name + ' (' + account.type + ') ••••' + account.mask;
                  accountSelect.appendChild(option);
                });
                
                // Set selected value
                accountSelect.value = state.selectedAccountId;
              }
              
              // AUTO-POPULATE DESCRIPTION HERE (after payment details are visible)
              if (selectedPlan) {
                var descriptionInput = document.getElementById('descriptionInput');
                if (descriptionInput) {
                  descriptionInput.value = selectedPlan;
                  state.description = selectedPlan;
                }
              }
              
              updateConnectedBadge();
              updateUI();
              validateForm();
            } else {
              alert('Bank connection failed: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(function(error) {
            console.error('Exchange error:', error);
            alert('Bank connection failed. Please try again.');
          });
        },
        onExit: function(err, metadata) {
          console.log('Plaid Link exited:', err, metadata);
        }
      });
      
      // Event listeners
      document.addEventListener('DOMContentLoaded', function() {
        // Load AcceptUI configuration
        loadPaymentConfig();
        
        updateUI();
        
        // Handle payment method selection
        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
          radio.addEventListener('change', function() {
            const method = this.value;
            
            // Update method option styling
            document.querySelectorAll('.method-option').forEach(option => {
              option.classList.remove('selected');
            });
            this.closest('.method-option').classList.add('selected');
            
            // Hide all sections
            document.getElementById('bankSection').classList.add('hidden');
            document.getElementById('cardSection').classList.add('hidden');
            document.getElementById('paymentDetails').classList.add('hidden');
            
            // Show selected section
            if (method === 'bank') {
              document.getElementById('bankSection').classList.remove('hidden');
            } else if (method === 'card') {
              document.getElementById('cardSection').classList.remove('hidden');
            }
            
            updateOrderSummary();
          });
        });
        
        // Connect button
        var connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
          connectBtn.addEventListener('click', function() {
            handler.open();
          });
        }
        
        // Change bank link
        var changeBankLink = document.getElementById('changeBankLink');
        if (changeBankLink) {
          changeBankLink.addEventListener('click', function(e) {
            e.preventDefault();
            handler.open();
          });
        }
        
        // Amount input - normal text input
        var amountInput = document.getElementById('amountInput');
        if (amountInput) {
          // Prevent wheel events
          amountInput.addEventListener('wheel', function(e) {
            e.preventDefault();
          });
          
          amountInput.addEventListener('input', function() {
            var value = this.value;
            var parsedAmount = parseAmount(value);
            
            // Update state
            state.amount = parsedAmount;
            
            updateOrderSummary();
            updateReviewRow();
            validateForm();
          });
          
          // Format on blur (when user leaves the field)
          amountInput.addEventListener('blur', function() {
            if (state.amount > 0) {
              this.value = formatAmount(state.amount);
            }
          });
          
          // Allow user to clear the field
          amountInput.addEventListener('focus', function() {
            if (this.value === '0.00') {
              this.value = '';
            }
          });
        }
        
        // Card amount input handling
        const cardAmountInput = document.getElementById('cardAmount');
        if (cardAmountInput) {
          cardAmountInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            updateOrderSummary();
            validateCardForm();
          });
          
          cardAmountInput.addEventListener('blur', function() {
            const amount = parseAmount(this.value);
            if (amount > 0) {
              this.value = formatAmount(amount);
            }
          });
        }
        
        // Account select - controlled select
        var accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
          accountSelect.addEventListener('change', function() {
            state.selectedAccountId = this.value;
            updateConnectedBadge();
            updateReviewRow();
            validateForm();
          });
        }
        
        // Description input
        var descriptionInput = document.getElementById('descriptionInput');
        if (descriptionInput) {
          descriptionInput.addEventListener('input', function() {
            state.description = this.value;
            updateReviewRow();
          });
        }
        
        // Pay button
        var payBtn = document.getElementById('payBtn');
        if (payBtn) {
          payBtn.addEventListener('click', function() {
            if (state.isSubmitting || !validateForm()) return;
            
            state.isSubmitting = true;
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
            .then(response => response.json())
            .then(function(result) {
              if (result.success) {
                // Show success view
                state.currentStep = 'success';
                
                var successAmount = document.getElementById('successAmount');
                var successAccount = document.getElementById('successAccount');
                var successDate = document.getElementById('successDate');
                
                var selected = getSelectedAccount();
                var accountName = selected ? (selected.name + ' ••••' + selected.mask) : 'Account';
                
                if (successAmount) successAmount.textContent = formatCurrency(state.amount);
                if (successAccount) successAccount.textContent = accountName;
                if (successDate) successDate.textContent = new Date().toLocaleDateString();
                
                updateUI();
              } else {
                alert('Payment failed: ' + (result.error || 'Unknown error'));
                state.isSubmitting = false;
                payBtn.disabled = false;
                payBtn.textContent = 'Complete payment';
              }
            })
            .catch(function(error) {
              console.error('Payment error:', error);
              alert('Payment failed. Please try again.');
              state.isSubmitting = false;
              payBtn.disabled = false;
              payBtn.textContent = 'Complete payment';
            });
          });
        }
        
        // New payment button
        var newPaymentBtn = document.getElementById('newPaymentBtn');
        if (newPaymentBtn) {
          newPaymentBtn.addEventListener('click', function() {
            // Reset state
            state.isConnected = false;
            state.currentStep = 'connect';
            state.accounts = [];
            state.selectedAccountId = null;
            state.amount = 0;
            state.description = '';
            
            // Reset form
            if (amountInput) amountInput.value = '';
            if (cardAmountInput) cardAmountInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            if (accountSelect) accountSelect.innerHTML = '<option value="">Choose an account...</option>';
            
            updateOrderSummary();
            updateUI();
            validateForm();
          });
        }
      });
    })();
  </script>
  `
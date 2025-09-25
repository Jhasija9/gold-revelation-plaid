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

function renderPage({ linkToken, error, userId }) {
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
</head>
<body>
  <div class="container">
    <div class="grid">
      <!-- Left Column: Payment Flow -->
      <div class="main-content">
        <div class="card">
          <h1 class="font-serif">Complete your purchase</h1>
          <p class="subtitle">Securely connect your bank account to complete your gold purchase</p>
          
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
            <div class="method-option disabled" data-method="card">
              <input type="radio" name="payment-method" value="card" class="method-radio" disabled>
              <div class="method-icon">💳</div>
              <div class="method-content">
                <div class="method-title">Credit/Debit card</div>
                <div class="method-desc">Coming soon</div>
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
                placeholder="$0.00" 
                required
              >
              <div id="amountError" class="error-message hidden">Please enter a valid amount</div>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="descriptionInput">Description (optional)</label>
              <input 
                type="text" 
                id="descriptionInput" 
                class="form-input" 
                placeholder="What are you purchasing?"
              >
            </div>
            
            <div class="checkbox-group">
              <input type="checkbox" id="saveBankCheckbox" class="checkbox">
              <label for="saveBankCheckbox" class="checkbox-label">Save this bank for faster checkout</label>
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
              <div>Reference: <span id="successReference">Reference</span></div>
            </div>
            <div class="success-actions">
              <a href="/dashboard" class="btn-primary">Back to Dashboard</a>
              <button id="newPaymentBtn" class="btn-secondary">New payment</button>
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
      var isConnected = false;
      var isSubmitting = false;
      var currentStep = 'connect'; // connect, details, success
      var accountsData = [];
      var selectedAccount = null;
      
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
        if (currentStep === 'connect') {
          if (connectBtn) connectBtn.classList.remove('hidden');
        } else if (currentStep === 'details') {
          if (connectedBadge) connectedBadge.classList.remove('hidden');
          if (paymentDetails) paymentDetails.classList.remove('hidden');
        } else if (currentStep === 'success') {
          if (successView) successView.classList.remove('hidden');
        }
      }
      
      // Currency formatting
      function formatCurrency(value) {
        var num = parseFloat(value) || 0;
        return '$' + num.toFixed(2);
      }
      
      // Update order summary
      function updateOrderSummary(amount) {
        var orderAmount = document.getElementById('orderAmount');
        var orderTotal = document.getElementById('orderTotal');
        var formattedAmount = formatCurrency(amount);
        
        if (orderAmount) orderAmount.textContent = formattedAmount;
        if (orderTotal) orderTotal.textContent = formattedAmount;
      }
      
      // Validate form
      function validateForm() {
        var amountInput = document.getElementById('amountInput');
        var accountSelect = document.getElementById('accountSelect');
        var payBtn = document.getElementById('payBtn');
        
        var amount = parseFloat(amountInput.value.replace(/[^0-9.]/g, '')) || 0;
        var isValid = isConnected && amount > 0 && accountSelect.value;
        
        if (payBtn) {
          payBtn.disabled = !isValid;
        }
        
        return isValid;
      }
      
      // Update review row
      function updateReviewRow() {
        var amountInput = document.getElementById('amountInput');
        var accountSelect = document.getElementById('accountSelect');
        var reviewRow = document.getElementById('reviewRow');
        var reviewAmount = document.getElementById('reviewAmount');
        var reviewAccount = document.getElementById('reviewAccount');
        
        var amount = parseFloat(amountInput.value.replace(/[^0-9.]/g, '')) || 0;
        var accountText = accountSelect.options[accountSelect.selectedIndex]?.text || 'Account';
        
        if (amount > 0 && accountSelect.value) {
          if (reviewRow) reviewRow.classList.remove('hidden');
          if (reviewAmount) reviewAmount.textContent = formatCurrency(amount);
          if (reviewAccount) reviewAccount.textContent = accountText;
        } else {
          if (reviewRow) reviewRow.classList.add('hidden');
        }
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
              isConnected = true;
              accountsData = data.accounts;
              currentStep = 'details';
              
              // Update connected badge
              var connectedText = document.getElementById('connectedText');
              if (connectedText) {
                connectedText.textContent = 'Connected — ' + metadata.institution.name + ' ••••' + metadata.accounts[0].mask;
              }
              
              // Populate account dropdown
              var accountSelect = document.getElementById('accountSelect');
              if (accountSelect && accountsData.length > 0) {
                accountSelect.innerHTML = '<option value="">Choose an account...</option>';
                accountsData.forEach(function(account) {
                  var option = document.createElement('option');
                  option.value = account.id;
                  option.textContent = account.name + ' (' + account.type + ') ••••' + account.mask;
                  accountSelect.appendChild(option);
                });
                
                // Select first account by default
                accountSelect.selectedIndex = 1;
                selectedAccount = accountsData[0];
              }
              
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
        updateUI();
        
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
        
        // Amount input formatting
        var amountInput = document.getElementById('amountInput');
        if (amountInput) {
          amountInput.addEventListener('input', function() {
            var value = this.value.replace(/[^0-9.]/g, '');
            var num = parseFloat(value) || 0;
            this.value = formatCurrency(num).substring(1); // Remove $ for input
            
            updateOrderSummary(num);
            updateReviewRow();
            validateForm();
          });
        }
        
        // Account select
        var accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
          accountSelect.addEventListener('change', function() {
            selectedAccount = accountsData.find(function(acc) {
              return acc.id === this.value;
            }.bind(this));
            updateReviewRow();
            validateForm();
          });
        }
        
        // Description input
        var descriptionInput = document.getElementById('descriptionInput');
        if (descriptionInput) {
          descriptionInput.addEventListener('input', function() {
            updateReviewRow();
          });
        }
        
        // Pay button
        var payBtn = document.getElementById('payBtn');
        if (payBtn) {
          payBtn.addEventListener('click', function() {
            if (isSubmitting || !validateForm()) return;
            
            isSubmitting = true;
            payBtn.disabled = true;
            payBtn.innerHTML = '<span class="spinner"></span>Processing...';
            
            var amount = parseFloat(amountInput.value.replace(/[^0-9.]/g, '')) || 0;
            var description = descriptionInput.value || 'Gold purchase';
            
            fetch('/api/transfers/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: USER_ID,
                account_id: accountSelect.value,
                amount: amount,
                description: description
              })
            })
            .then(response => response.json())
            .then(function(result) {
              if (result.success) {
                // Show success view
                currentStep = 'success';
                
                var successAmount = document.getElementById('successAmount');
                var successAccount = document.getElementById('successAccount');
                var successDate = document.getElementById('successDate');
                var successReference = document.getElementById('successReference');
                
                if (successAmount) successAmount.textContent = formatCurrency(amount);
                if (successAccount) successAccount.textContent = accountSelect.options[accountSelect.selectedIndex].text;
                if (successDate) successDate.textContent = new Date().toLocaleDateString();
                if (successReference) successReference.textContent = result.transfer_id || 'N/A';
                
                updateUI();
              } else {
                alert('Payment failed: ' + (result.error || 'Unknown error'));
                isSubmitting = false;
                payBtn.disabled = false;
                payBtn.textContent = 'Complete payment';
              }
            })
            .catch(function(error) {
              console.error('Payment error:', error);
              alert('Payment failed. Please try again.');
              isSubmitting = false;
              payBtn.disabled = false;
              payBtn.textContent = 'Complete payment';
            });
          });
        }
        
        // New payment button
        var newPaymentBtn = document.getElementById('newPaymentBtn');
        if (newPaymentBtn) {
          newPaymentBtn.addEventListener('click', function() {
            // Reset form
            isConnected = false;
            currentStep = 'connect';
            accountsData = [];
            selectedAccount = null;
            
            if (amountInput) amountInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            if (accountSelect) accountSelect.innerHTML = '<option value="">Choose an account...</option>';
            
            updateOrderSummary(0);
            updateUI();
            validateForm();
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

    if (!sessionId) {
      return res.status(200).send(
        renderPage({
          linkToken: null,
          error: "Your session expired. Please start again.",
          userId: null,
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

    return res.status(200).send(
      renderPage({
        linkToken,
        error: null,
        userId: session.user_id,
      })
    );
  } catch (err) {
    // render an error page WITHOUT crashing template
    return res.status(500).send(
      renderPage({
        linkToken: null,
        error:
          "Something went wrong creating your bank connection. Please try again.",
        userId: null,
      })
    );
  }
});

module.exports = router;
console.log("Connect route loaded");
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
<style>
  * { box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc; 
    margin: 0; 
    padding: 0; 
    color: #0f172a;
    line-height: 1.5;
  }
  
  .container { 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 48px 24px; 
  }
  
  .grid { 
    display: grid; 
    grid-template-columns: 1fr 400px; 
    gap: 32px; 
  }
  
  .card { 
    background: white; 
    border: 1px solid #e2e8f0; 
    border-radius: 16px; 
    padding: 28px; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .sticky { 
    position: sticky; 
    top: 24px; 
  }
  
  h1 { 
    font-size: 24px; 
    font-weight: 600; 
    color: #0f172a; 
    margin: 0 0 8px; 
  }
  
  .subtitle { 
    color: #64748b; 
    font-size: 14px; 
    margin-bottom: 32px; 
  }
  
  .section-title { 
    font-size: 18px; 
    font-weight: 600; 
    color: #0f172a; 
    margin: 0 0 16px; 
  }
  
  .method-group { 
    margin-bottom: 24px; 
  }
  
  .method-option { 
    display: flex; 
    align-items: center; 
    padding: 16px; 
    border: 2px solid #e2e8f0; 
    border-radius: 12px; 
    margin-bottom: 12px; 
    cursor: pointer; 
    transition: all 0.2s;
  }
  
  .method-option:hover { 
    border-color: #cbd5e1; 
  }
  
  .method-option.selected { 
    border-color: #3b82f6; 
    background: #f0f9ff; 
  }
  
  .method-option.disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
  }
  
  .method-radio { 
    margin-right: 12px; 
  }
  
  .method-content { 
    flex: 1; 
  }
  
  .method-title { 
    font-weight: 600; 
    color: #0f172a; 
    margin: 0 0 4px; 
  }
  
  .method-desc { 
    font-size: 14px; 
    color: #64748b; 
    margin: 0; 
  }
  
  .connect-btn { 
    width: 100%; 
    background: #3b82f6; 
    color: white; 
    border: none; 
    border-radius: 12px; 
    padding: 16px; 
    font-weight: 600; 
    font-size: 16px; 
    cursor: pointer; 
    transition: background 0.2s;
    margin-bottom: 16px;
  }
  
  .connect-btn:hover { 
    background: #2563eb; 
  }
  
  .connect-btn:disabled { 
    background: #94a3b8; 
    cursor: not-allowed; 
  }
  
  .connected-badge { 
    display: flex; 
    align-items: center; 
    padding: 12px 16px; 
    background: #f0f9ff; 
    border: 1px solid #0ea5e9; 
    border-radius: 12px; 
    margin-bottom: 24px; 
  }
  
  .connected-icon { 
    color: #059669; 
    margin-right: 8px; 
  }
  
  .connected-text { 
    flex: 1; 
    font-weight: 500; 
    color: #0f172a; 
  }
  
  .change-link { 
    color: #3b82f6; 
    text-decoration: none; 
    font-size: 14px; 
  }
  
  .form-group { 
    margin-bottom: 20px; 
  }
  
  .form-label { 
    display: block; 
    font-weight: 500; 
    color: #374151; 
    margin-bottom: 6px; 
    font-size: 14px; 
  }
  
  .form-input { 
    width: 100%; 
    padding: 12px 16px; 
    border: 1px solid #d1d5db; 
    border-radius: 8px; 
    font-size: 16px; 
    transition: border-color 0.2s;
  }
  
  .form-input:focus { 
    outline: none; 
    border-color: #3b82f6; 
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); 
  }
  
  .form-input.error { 
    border-color: #dc2626; 
  }
  
  .form-select { 
    width: 100%; 
    padding: 12px 16px; 
    border: 1px solid #d1d5db; 
    border-radius: 8px; 
    font-size: 16px; 
    background: white; 
    cursor: pointer; 
  }
  
  .form-select:focus { 
    outline: none; 
    border-color: #3b82f6; 
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); 
  }
  
  .checkbox-group { 
    display: flex; 
    align-items: center; 
    margin-bottom: 24px; 
  }
  
  .checkbox { 
    margin-right: 8px; 
  }
  
  .checkbox-label { 
    font-size: 14px; 
    color: #64748b; 
  }
  
  .review-row { 
    background: #f8fafc; 
    padding: 16px; 
    border-radius: 8px; 
    margin-bottom: 24px; 
    font-size: 14px; 
    color: #374151; 
  }
  
  .pay-btn { 
    width: 100%; 
    background: #059669; 
    color: white; 
    border: none; 
    border-radius: 12px; 
    padding: 16px; 
    font-weight: 600; 
    font-size: 16px; 
    cursor: pointer; 
    transition: background 0.2s;
  }
  
  .pay-btn:hover { 
    background: #047857; 
  }
  
  .pay-btn:disabled { 
    background: #94a3b8; 
    cursor: not-allowed; 
  }
  
  .success-view { 
    text-align: center; 
    padding: 48px 24px; 
  }
  
  .success-icon { 
    color: #059669; 
    font-size: 48px; 
    margin-bottom: 16px; 
  }
  
  .success-title { 
    font-size: 24px; 
    font-weight: 600; 
    color: #0f172a; 
    margin: 0 0 8px; 
  }
  
  .success-details { 
    color: #64748b; 
    margin-bottom: 32px; 
  }
  
  .success-actions { 
    display: flex; 
    gap: 12px; 
    justify-content: center; 
  }
  
  .btn-primary { 
    background: #3b82f6; 
    color: white; 
    border: none; 
    border-radius: 8px; 
    padding: 12px 24px; 
    font-weight: 500; 
    cursor: pointer; 
    text-decoration: none; 
    display: inline-block; 
  }
  
  .btn-secondary { 
    background: white; 
    color: #374151; 
    border: 1px solid #d1d5db; 
    border-radius: 8px; 
    padding: 12px 24px; 
    font-weight: 500; 
    cursor: pointer; 
    text-decoration: none; 
    display: inline-block; 
  }
  
  .order-summary { 
    background: white; 
    border: 1px solid #e2e8f0; 
    border-radius: 16px; 
    padding: 24px; 
  }
  
  .order-title { 
    font-size: 18px; 
    font-weight: 600; 
    color: #0f172a; 
    margin: 0 0 20px; 
  }
  
  .order-item { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 12px; 
    font-size: 14px; 
  }
  
  .order-item.total { 
    border-top: 1px solid #e2e8f0; 
    padding-top: 12px; 
    font-weight: 600; 
    font-size: 16px; 
  }
  
  .trust-row { 
    display: flex; 
    align-items: center; 
    margin-top: 20px; 
    padding-top: 20px; 
    border-top: 1px solid #e2e8f0; 
    font-size: 12px; 
    color: #64748b; 
  }
  
  .trust-icon { 
    margin-right: 8px; 
    color: #059669; 
  }
  
  .error-message { 
    color: #dc2626; 
    font-size: 12px; 
    margin-top: 4px; 
  }
  
  .loading { 
    opacity: 0.6; 
    pointer-events: none; 
  }
  
  .hidden { 
    display: none; 
  }
  
  @media (max-width: 768px) {
    .grid { 
      grid-template-columns: 1fr; 
    }
    .sticky { 
      position: static; 
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
          <h1>Complete your purchase</h1>
          <p class="subtitle">Securely connect your bank account to complete your gold purchase</p>
          
          ${
            error
              ? `
            <div style="color: #dc2626; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 24px;">
              <strong>Error:</strong> ${error}
            </div>
            <p><a href="/" style="color: #3b82f6;">← Start over</a></p>
          `
              : `
          <!-- Payment Method Selection -->
          <div class="method-group">
            <div class="section-title">Payment method</div>
            <div class="method-option selected" data-method="bank">
              <input type="radio" name="payment-method" value="bank" class="method-radio" checked>
              <div class="method-content">
                <div class="method-title">Bank account (Plaid)</div>
                <div class="method-desc">Connect your bank account securely</div>
              </div>
            </div>
            <div class="method-option disabled" data-method="card">
              <input type="radio" name="payment-method" value="card" class="method-radio" disabled>
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
            <h2 class="success-title">Payment successful!</h2>
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
              <a href="/terms" style="color: #3b82f6;">Terms</a> • 
              <a href="/privacy" style="color: #3b82f6;">Privacy</a>
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
                connectedText.textContent = metadata.institution.name + ' ••••' + metadata.accounts[0].mask;
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
            payBtn.textContent = 'Processing...';
            
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
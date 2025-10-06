// // src/routes/connect.js
// const express = require("express");
// const router = express.Router();
// const cookie = require("cookie");

// const LinkSession = require("../models/LinkSession");
// const plaidService = require("../services/plaidService");

// function parseCookies(req) {
//   const header = req.headers.cookie || "";
//   return cookie.parse(header);
// }

// function renderPage({ linkToken, error, userId, selectedPlan }) {
//   return `<!doctype html>
// <html lang="en">
// <head>
// <meta charset="utf-8"/>
// <meta name="viewport" content="width=device-width,initial-scale=1"/>
// <title>Complete Your Purchase - Revelation Gold Group</title>
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
// <style>
//   :root {
//     --rg-navy: #0f2547;
//     --rg-navy-50: #f0f4f8;
//     --rg-navy-600: #0a1f3a;
//     --rg-ink: #0f2547;
//     --rg-body: #64748b;
//     --rg-border: #e2e8f0;
//     --rg-card: #ffffff;
//     --rg-gold: #d4af37;
//   }
  
//   * { 
//     box-sizing: border-box; 
//     margin: 0;
//     padding: 0;
//   }
  
//   body { 
//     font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//     background: #f8fafc; 
//     color: var(--rg-body);
//     line-height: 1.6;
//     font-size: 15px;
//   }
  
//   .font-serif {
//     font-family: 'Playfair Display', Georgia, serif;
//   }
  
//   .container { 
//     max-width: 1200px; 
//     margin: 0 auto; 
//     padding: 48px 32px; 
//   }
  
//   .grid { 
//     display: grid; 
//     grid-template-columns: 7fr 5fr; 
//     gap: 32px; 
//   }
  
//   .card { 
//     background: var(--rg-card); 
//     border: 1px solid var(--rg-border); 
//     border-radius: 16px; 
//     padding: 28px; 
//     box-shadow: 0 6px 24px rgba(15, 39, 65, 0.06);
//   }
  
//   .sticky { 
//     position: sticky; 
//     top: 40px; 
//   }
  
//   .header {
//     text-align: center;
//     margin-bottom: 40px;
//   }
  
//   .logo {
//     height: 60px;
//     margin-bottom: 16px;
//   }
  
//   h1 { 
//     font-family: 'Playfair Display', Georgia, serif;
//     font-size: 28px; 
//     font-weight: 600; 
//     color: var(--rg-ink); 
//     margin: 0 0 8px; 
//   }
  
//   .subtitle { 
//     color: var(--rg-body); 
//     font-size: 15px; 
//     margin-bottom: 32px; 
//   }
  
//   .section-title { 
//     font-family: 'Playfair Display', Georgia, serif;
//     font-size: 20px; 
//     font-weight: 600; 
//     color: var(--rg-ink); 
//     margin: 0 0 16px; 
//   }
  
//   .method-group { 
//     margin-bottom: 32px; 
//   }
  
//   .method-option { 
//     display: flex; 
//     align-items: center; 
//     padding: 20px; 
//     border: 1px solid var(--rg-border); 
//     border-radius: 12px; 
//     margin-bottom: 12px; 
//     cursor: pointer; 
//     transition: all 0.2s ease;
//     background: var(--rg-card);
//   }
  
//   .method-option:hover { 
//     border-color: rgba(15, 39, 65, 0.3); 
//   }
  
//   .method-option.selected { 
//     border-color: var(--rg-navy); 
//     background: var(--rg-navy-50);
//     box-shadow: 0 0 0 4px var(--rg-navy-50);
//   }
  
//   .method-option.disabled { 
//     opacity: 0.5; 
//     cursor: not-allowed; 
//   }
  
//   .method-radio { 
//     margin-right: 16px; 
//     width: 20px;
//     height: 20px;
//     accent-color: var(--rg-navy);
//   }
  
//   .method-content { 
//     flex: 1; 
//   }
  
//   .method-title { 
//     font-weight: 600; 
//     color: var(--rg-ink); 
//     margin: 0 0 4px; 
//     font-size: 16px;
//   }
  
//   .method-desc { 
//     font-size: 14px; 
//     color: rgba(100, 116, 139, 0.7); 
//     margin: 0; 
//   }
  
//   .method-icon {
//     width: 24px;
//     height: 24px;
//     margin-right: 12px;
//     color: var(--rg-navy);
//   }
  
//   .connect-btn { 
//     width: 100%; 
//     background: var(--rg-navy); 
//     color: white; 
//     border: none; 
//     border-radius: 12px; 
//     padding: 16px; 
//     font-weight: 600; 
//     font-size: 16px; 
//     cursor: pointer; 
//     transition: all 0.2s ease;
//     box-shadow: 0 4px 14px rgba(15, 39, 65, 0.18);
//   }
  
//   .connect-btn:hover { 
//     background: var(--rg-navy-600); 
//   }
  
//   .connect-btn:focus { 
//     outline: none; 
//     box-shadow: 0 0 0 4px var(--rg-navy-50), 0 4px 14px rgba(15, 39, 65, 0.18);
//   }
  
//   .connect-btn:disabled { 
//     background: #94a3b8; 
//     cursor: not-allowed; 
//     opacity: 0.6;
//   }
  
//   .connected-badge { 
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//     padding: 8px 12px; 
//     background: #f0fdf4; 
//     border: 1px solid #bbf7d0; 
//     border-radius: 9999px; 
//     margin-bottom: 24px; 
//     font-size: 14px;
//     font-weight: 500;
//     color: #166534;
//   }
  
//   .connected-icon { 
//     color: #059669; 
//   }
  
//   .connected-text { 
//     flex: 1; 
//   }
  
//   .change-link { 
//     color: var(--rg-navy); 
//     text-decoration: none; 
//     font-size: 14px; 
//     font-weight: 500;
//   }
  
//   .change-link:hover {
//     text-decoration: underline;
//   }
  
//   .form-group { 
//     margin-bottom: 24px; 
//   }
  
//   .form-label { 
//     display: block; 
//     font-weight: 500; 
//     color: var(--rg-ink); 
//     margin-bottom: 8px; 
//     font-size: 14px; 
//   }
  
//   .form-input { 
//     width: 100%; 
//     padding: 12px 16px; 
//     border: 1px solid var(--rg-border); 
//     border-radius: 8px; 
//     font-size: 15px; 
//     transition: all 0.2s ease;
//     background: var(--rg-card);
//   }
  
//   .form-input:focus { 
//     outline: none; 
//     border-color: var(--rg-navy); 
//     box-shadow: 0 0 0 3px var(--rg-navy-50); 
//   }
  
//   .form-input.error { 
//     border-color: #dc2626; 
//   }
  
//   .form-select { 
//     width: 100%; 
//     padding: 12px 16px; 
//     border: 1px solid var(--rg-border); 
//     border-radius: 8px; 
//     font-size: 15px; 
//     background: var(--rg-card); 
//     cursor: pointer; 
//     transition: all 0.2s ease;
//   }
  
//   .form-select:focus { 
//     outline: none; 
//     border-color: var(--rg-navy); 
//     box-shadow: 0 0 0 3px var(--rg-navy-50); 
//   }
  
//   .checkbox-group { 
//     display: flex; 
//     align-items: center; 
//     margin-bottom: 32px; 
//   }
  
//   .checkbox { 
//     margin-right: 12px; 
//     width: 16px;
//     height: 16px;
//     accent-color: var(--rg-navy);
//   }
  
//   .checkbox-label { 
//     font-size: 14px; 
//     color: var(--rg-body); 
//   }
  
//   .review-row { 
//     background: var(--rg-navy-50); 
//     padding: 16px; 
//     border-radius: 8px; 
//     margin-bottom: 24px; 
//     font-size: 14px; 
//     color: var(--rg-ink);
//     border: 1px solid var(--rg-border);
//   }
  
//   .pay-btn { 
//     width: 100%; 
//     background: var(--rg-navy); 
//     color: white; 
//     border: none; 
//     border-radius: 12px; 
//     padding: 16px; 
//     font-weight: 600; 
//     font-size: 16px; 
//     cursor: pointer; 
//     transition: all 0.2s ease;
//     box-shadow: 0 4px 14px rgba(15, 39, 65, 0.18);
//   }
  
//   .pay-btn:hover { 
//     background: var(--rg-navy-600); 
//   }
  
//   .pay-btn:focus { 
//     outline: none; 
//     box-shadow: 0 0 0 4px var(--rg-navy-50), 0 4px 14px rgba(15, 39, 65, 0.18);
//   }
  
//   .pay-btn:disabled { 
//     background: #94a3b8; 
//     cursor: not-allowed; 
//     opacity: 0.6;
//   }
  
//   .success-view { 
//     text-align: center; 
//     padding: 48px 24px; 
//   }
  
//   .success-icon { 
//     color: var(--rg-gold); 
//     font-size: 48px; 
//     margin-bottom: 16px; 
//   }
  
//   .success-title { 
//     font-family: 'Playfair Display', Georgia, serif;
//     font-size: 28px; 
//     font-weight: 600; 
//     color: var(--rg-ink); 
//     margin: 0 0 16px; 
//   }
  
//   .success-details { 
//     color: var(--rg-body); 
//     margin-bottom: 32px; 
//     font-size: 15px;
//   }
  
//   .success-details div {
//     margin-bottom: 8px;
//   }
  
//   .success-actions { 
//     display: flex; 
//     gap: 12px; 
//     justify-content: center; 
//   }
  
//   .btn-primary { 
//     background: var(--rg-navy); 
//     color: white; 
//     border: none; 
//     border-radius: 8px; 
//     padding: 12px 24px; 
//     font-weight: 500; 
//     cursor: pointer; 
//     text-decoration: none; 
//     display: inline-block; 
//     transition: all 0.2s ease;
//   }
  
//   .btn-primary:hover {
//     background: var(--rg-navy-600);
//   }
  
//   .btn-secondary { 
//     background: white; 
//     color: var(--rg-navy); 
//     border: 1px solid var(--rg-border); 
//     border-radius: 8px; 
//     padding: 12px 24px; 
//     font-weight: 500; 
//     cursor: pointer; 
//     text-decoration: none; 
//     display: inline-block; 
//     transition: all 0.2s ease;
//   }
  
//   .btn-secondary:hover {
//     background: var(--rg-navy-50);
//   }
  
//   .order-summary { 
//     background: var(--rg-card); 
//     border: 1px solid var(--rg-border); 
//     border-radius: 16px; 
//     padding: 24px; 
//   }
  
//   .order-title { 
//     font-family: 'Playfair Display', Georgia, serif;
//     font-size: 20px; 
//     font-weight: 600; 
//     color: var(--rg-ink); 
//     margin: 0 0 20px; 
//   }
  
//   .order-item { 
//     display: flex; 
//     justify-content: space-between; 
//     margin-bottom: 12px; 
//     font-size: 14px; 
//     padding-bottom: 12px;
//     border-bottom: 1px solid var(--rg-border);
//   }
  
//   .order-item:last-child {
//     border-bottom: none;
//     padding-bottom: 0;
//   }
  
//   .order-item.total { 
//     font-weight: 600; 
//     font-size: 16px; 
//     color: var(--rg-ink);
//     margin-top: 12px;
//     padding-top: 12px;
//     border-top: 1px solid var(--rg-border);
//   }
  
//   .trust-row { 
//     display: flex; 
//     align-items: center; 
//     margin-top: 20px; 
//     padding-top: 20px; 
//     border-top: 1px solid var(--rg-border); 
//     font-size: 12px; 
//     color: var(--rg-body); 
//   }
  
//   .trust-icon { 
//     margin-right: 8px; 
//     color: var(--rg-gold); 
//   }
  
//   .trust-row a {
//     color: var(--rg-navy);
//     text-decoration: none;
//   }
  
//   .trust-row a:hover {
//     text-decoration: underline;
//   }
  
//   .error-message { 
//     color: #dc2626; 
//     font-size: 13px; 
//     margin-top: 4px; 
//   }
  
//   .loading { 
//     opacity: 0.6; 
//     pointer-events: none; 
//   }
  
//   .hidden { 
//     display: none; 
//   }
  
//   .spinner {
//     display: inline-block;
//     width: 16px;
//     height: 16px;
//     border: 2px solid transparent;
//     border-top: 2px solid currentColor;
//     border-radius: 50%;
//     animation: spin 1s linear infinite;
//     margin-right: 8px;
//   }
  
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
  
//   @media (max-width: 768px) {
//     .grid { 
//       grid-template-columns: 1fr; 
//     }
//     .sticky { 
//       position: static; 
//     }
//     .container {
//       padding: 24px 16px;
//     }
//   }
// </style>
// <script src="/js/cc-acceptui.js" defer></script>
// </head>
// <body>
//   <div class="container">
//     <div class="grid">
//       <!-- Left Column: Payment Flow -->
//       <div class="main-content">
//   <div class="card">
//           <!-- Company Logo and Header -->
//           <div class="header">
//             <img src="/logo.png" alt="Revelation Gold Group" class="logo" onerror="this.style.display='none'">
//             <h1 class="font-serif">Complete your purchase</h1>
//             <p class="subtitle">Securely connect your bank account to complete your gold purchase</p>
//           </div>
          
//     ${
//       error
//         ? `
//             <div style="color: #dc2626; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 24px;">
//               <strong>Error:</strong> ${error}
//             </div>
//             <p><a href="/" style="color: var(--rg-navy);">← Start over</a></p>
//           `
//               : `
//           <!-- Payment Method Selection -->
//           <div class="method-group">
//             <div class="section-title">Payment method</div>
//             <div class="method-option selected" data-method="bank">
//               <input type="radio" name="payment-method" value="bank" class="method-radio" checked>
//               <div class="method-icon">🏦</div>
//               <div class="method-content">
//                 <div class="method-title">Bank account (Plaid)</div>
//                 <div class="method-desc">Connect your bank account securely</div>
//               </div>
//             </div>
//             <div class="method-option" data-method="card">
//   <input type="radio" name="payment-method" value="card" class="method-radio">
//   <div class="method-icon">💳</div>
//   <div class="method-content">
//     <div class="method-title">Credit/Debit card</div>
//     <div class="method-desc">Pay instantly with your credit or debit card</div>
//   </div>
// </div>
//           </div>

//           <!-- Bank Connection Section -->
//           <div id="bankSection">
//             <button id="connectBtn" class="connect-btn">
//               Connect bank account
//             </button>
            
//             <div id="connectedBadge" class="connected-badge hidden">
//               <div class="connected-icon">✓</div>
//               <div class="connected-text" id="connectedText">Bank connected</div>
//               <a href="#" id="changeBankLink" class="change-link">Change</a>
//             </div>
//           </div>

//           <!-- Payment Details (shown after bank connection) -->
//           <div id="paymentDetails" class="hidden">
//             <div class="section-title">Payment details</div>
            
//             <div class="form-group">
//               <label class="form-label" for="accountSelect">Account</label>
//               <select id="accountSelect" class="form-select" required>
//                 <option value="">Choose an account...</option>
//               </select>
//             </div>
            
//             <div class="form-group">
//               <label class="form-label" for="amountInput">Amount</label>
//               <input 
//                 type="text" 
//                 id="amountInput" 
//                 class="form-input" 
//                 placeholder="0.00" 
//                 inputmode="decimal"
//                 required
//               >
//               <div id="amountError" class="error-message hidden">Please enter a valid amount</div>
//             </div>
            
//             <div class="form-group">
//               <label class="form-label" for="descriptionInput">Investment Plan</label>
//               <input 
//                 type="text" 
//                 id="descriptionInput" 
//                 class="form-input" 
//                 placeholder="Plan will be auto-selected"
//                 readonly
//                 style="background-color: #f8fafc; cursor: not-allowed;"
//               >
//             </div>
            
//             <div id="reviewRow" class="review-row hidden">
//               <div>Pay <span id="reviewAmount">$0.00</span> from <span id="reviewAccount">Account</span></div>
//             </div>
            
//             <button id="payBtn" class="pay-btn" disabled>
//               Complete payment
//             </button>
//           </div>

//           <!-- Success View (shown after successful payment) -->
//           <div id="successView" class="success-view hidden">
//             <div class="success-icon">✓</div>
//             <h2 class="success-title">Payment successful</h2>
//             <div class="success-details">
//               <div>Amount: <span id="successAmount">$0.00</span></div>
//               <div>Account: <span id="successAccount">Account</span></div>
//               <div>Date: <span id="successDate">Date</span></div>
//             </div>
//             <div class="success-actions">
//               <button id="newPaymentBtn" class="btn-primary">New payment</button>
//             </div>
//           </div>

//           <!-- AcceptUI context (passes server values safely to frontend) -->
//           <div id="ccRoot" data-user-id="${userId || ''}" data-selected-plan="${selectedPlan || ''}"></div>

//           <!-- Credit Card Section (kept hidden unless you show it for testing) -->
//           <div id="cardSection">
//             <div class="section-title">Card Payment</div>

//             <div class="form-group">
//               <label class="form-label" for="ccAmount">Amount</label>
//               <input type="text" id="ccAmount" class="form-input" placeholder="0.00" inputmode="decimal">
//             </div>

//             <div class="form-group">
//               <label class="form-label" for="ccDescription">Description (optional)</label>
//               <input type="text" id="ccDescription" class="form-input" placeholder="Gold Investment Plan">
//             </div>

//             <div class="cc-status" style="margin:8px 0; color:#64748b;">Loading secure payment form…</div>
//             <div id="acceptUIContainer"></div>
//           </div>
//           `
//           }
//         </div>
//       </div>

//       <!-- Right Column: Order Summary -->
//       <div class="sticky">
//         <div class="order-summary">
//           <h3 class="order-title">Order summary</h3>
          
//           <div class="order-item">
//             <span>Gold Investment Plan</span>
//             <span id="orderAmount">$0.00</span>
//           </div>
          
//           <div class="order-item">
//             <span>Processing fee</span>
//             <span>$0.00</span>
//           </div>
          
//           <div class="order-item total">
//             <span>Total</span>
//             <span id="orderTotal">$0.00</span>
//           </div>
          
//           <div class="trust-row">
//             <div class="trust-icon">🔒</div>
//             <div>
//               Bank connection is secure via Plaid. 
//               <a href="/terms">Terms</a> • 
//               <a href="/privacy">Privacy</a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>

//   ${
//     linkToken
//       ? `
//   <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
//   <script>
//     (function(){
//       var USER_ID = ${JSON.stringify(userId ?? null)};
//       var linkToken = ${JSON.stringify(linkToken)};
//       var selectedPlan = ${JSON.stringify(selectedPlan || '')};
//       console.log('🔍 DEBUG: selectedPlan variable =', selectedPlan);
//       console.log('🔍 DEBUG: selectedPlan type =', typeof selectedPlan);
//       console.log('🔍 DEBUG: selectedPlan length =', selectedPlan ? selectedPlan.length : 'null/undefined');
      
//       // State management - single source of truth
//       var state = {
//         isConnected: false,
//         isSubmitting: false,
//         currentStep: 'connect', // connect, details, success
//         accounts: [], // Array of account objects
//         selectedAccountId: null, // Currently selected account ID
//         amount: 0, // Amount as decimal number
//         description: ''
//       };
      
//       // Get currently selected account
//       function getSelectedAccount() {
//         if (!state.selectedAccountId || state.accounts.length === 0) return null;
//         return state.accounts.find(function(acc) {
//           return acc.id === state.selectedAccountId;
//         });
//       }
      
//       // Update connected badge text based on selected account
//       function updateConnectedBadge() {
//         var selected = getSelectedAccount();
//         var connectedText = document.getElementById('connectedText');
//         if (connectedText && selected) {
//           var accountName = selected.name || selected.official_name || selected.subtype || 'Account';
//           connectedText.textContent = 'Connected — ' + accountName + ' ••••' + selected.mask;
//         }
//       }
      
//       // Format amount for display
//       function formatAmount(amount) {
//         return amount.toFixed(2);
//       }
      
//       // Parse amount input to decimal
//       function parseAmount(value) {
//         if (!value || value.trim() === '') return 0;
        
//         // Remove any non-numeric characters except decimal point
//         var cleaned = value.replace(/[^0-9.]/g, '');
//         if (cleaned === '') return 0;
        
//         // Ensure only one decimal point
//         var parts = cleaned.split('.');
//         if (parts.length > 2) {
//           cleaned = parts[0] + '.' + parts.slice(1).join('');
//         }
        
//         // Limit to 2 decimal places
//         if (parts[1] && parts[1].length > 2) {
//           cleaned = parts[0] + '.' + parts[1].substring(0, 2);
//         }
        
//         return parseFloat(cleaned) || 0;
//       }
      
//       // State management
//       function updateUI() {
//         var connectBtn = document.getElementById('connectBtn');
//         var connectedBadge = document.getElementById('connectedBadge');
//         var paymentDetails = document.getElementById('paymentDetails');
//         var successView = document.getElementById('successView');
        
//         // Hide all sections first
//         if (connectBtn) connectBtn.classList.add('hidden');
//         if (connectedBadge) connectedBadge.classList.add('hidden');
//         if (paymentDetails) paymentDetails.classList.add('hidden');
//         if (successView) successView.classList.add('hidden');
        
//         // Show appropriate section based on step
//         if (state.currentStep === 'connect') {
//           if (connectBtn) connectBtn.classList.remove('hidden');
//         } else if (state.currentStep === 'details') {
//           if (connectedBadge) connectedBadge.classList.remove('hidden');
//           if (paymentDetails) paymentDetails.classList.remove('hidden');
//         } else if (state.currentStep === 'success') {
//           if (successView) successView.classList.remove('hidden');
//         }
//       }
      
//       // Currency formatting for display
//       function formatCurrency(value) {
//         return '$' + value.toFixed(2);
//       }
      
//       // Update order summary
//       function updateOrderSummary() {
//         var orderAmount = document.getElementById('orderAmount');
//         var orderTotal = document.getElementById('orderTotal');
//         var formattedAmount = formatCurrency(state.amount);
        
//         if (orderAmount) orderAmount.textContent = formattedAmount;
//         if (orderTotal) orderTotal.textContent = formattedAmount;
//       }
      
//       // Validate form
//       function validateForm() {
//         var payBtn = document.getElementById('payBtn');
//         var isValid = state.isConnected && 
//                      state.selectedAccountId && 
//                      state.amount > 0;
        
//         if (payBtn) {
//           payBtn.disabled = !isValid;
//         }
        
//         return isValid;
//       }
      
//       // Update review row
//       function updateReviewRow() {
//         var reviewRow = document.getElementById('reviewRow');
//         var reviewAmount = document.getElementById('reviewAmount');
//         var reviewAccount = document.getElementById('reviewAccount');
        
//         var selected = getSelectedAccount();
        
//         if (state.amount > 0 && selected) {
//           if (reviewRow) reviewRow.classList.remove('hidden');
//           if (reviewAmount) reviewAmount.textContent = formatCurrency(state.amount);
//           if (reviewAccount) {
//             var accountName = selected.name || selected.official_name || selected.subtype || 'Account';
//             reviewAccount.textContent = accountName + ' ••••' + selected.mask;
//           }
//         } else {
//           if (reviewRow) reviewRow.classList.add('hidden');
//         }
//       }
      
//       // Initialize Plaid Link
//       var handler = Plaid.create({
//         token: linkToken,
//         onSuccess: function(public_token, metadata) {
//           console.log('Plaid Link success:', public_token, metadata);
          
//           // Exchange token
//           fetch('/api/plaid/exchange-token', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               public_token: public_token,
//               user_id: USER_ID
//             })
//           })
//           .then(response => response.json())
//           .then(data => {
//             console.log('Exchange result:', data);
//             if (data.success) {
//               state.isConnected = true;
//               state.accounts = data.accounts;
              
//               // Initialize selectedAccountId only if null
//               if (state.selectedAccountId === null && data.accounts.length > 0) {
//                 state.selectedAccountId = data.accounts[0].id;
//               }
              
//               state.currentStep = 'details';
              
//               // Populate account dropdown
//               var accountSelect = document.getElementById('accountSelect');
//               if (accountSelect && state.accounts.length > 0) {
//                 accountSelect.innerHTML = '<option value="">Choose an account...</option>';
//                 state.accounts.forEach(function(account) {
//                   var option = document.createElement('option');
//                   option.value = account.id;
//                   option.textContent = account.name + ' (' + account.type + ') ••••' + account.mask;
//                   accountSelect.appendChild(option);
//                 });
                
//                 // Set selected value
//                 accountSelect.value = state.selectedAccountId;
//               }
              
//               // AUTO-POPULATE DESCRIPTION HERE (after payment details are visible)
//               console.log('🔍 DEBUG: About to check selectedPlan for auto-populate');
//               console.log('🔍 DEBUG: selectedPlan value =', selectedPlan);
//               console.log('🔍 DEBUG: selectedPlan truthy =', !!selectedPlan);

//               if (selectedPlan) {
//                 console.log('🔍 DEBUG: selectedPlan is truthy, proceeding with auto-populate');
//                 var descriptionInput = document.getElementById('descriptionInput');
//                 console.log('�� DEBUG: descriptionInput element =', descriptionInput);
//                 console.log('�� DEBUG: descriptionInput found =', !!descriptionInput);
                
//                 if (descriptionInput) {
//                   console.log('🔍 DEBUG: Setting description input value to:', selectedPlan);
//                   descriptionInput.value = selectedPlan;
//                   state.description = selectedPlan;
//                   console.log('🔍 DEBUG: Auto-populate completed successfully');
//                   console.log('�� DEBUG: descriptionInput.value after setting =', descriptionInput.value);
//                   console.log('🔍 DEBUG: state.description after setting =', state.description);
//                 } else {
//                   console.log('🔍 DEBUG: ERROR - descriptionInput element not found!');
//                 }
//               } else {
//                 console.log('🔍 DEBUG: selectedPlan is falsy, skipping auto-populate');
//                 console.log('🔍 DEBUG: selectedPlan value was:', selectedPlan);
//               }
              
//               updateConnectedBadge();
//               updateUI();
//               validateForm();
//             } else {
//               alert('Bank connection failed: ' + (data.error || 'Unknown error'));
//             }
//           })
//           .catch(function(error) {
//             console.error('Exchange error:', error);
//             alert('Bank connection failed. Please try again.');
//           });
//         },
//         onExit: function(err, metadata) {
//           console.log('Plaid Link exited:', err, metadata);
//         }
//       });
      
//       // Event listeners
//       document.addEventListener('DOMContentLoaded', function() {
//         updateUI();
        
//         // Connect button
//         var connectBtn = document.getElementById('connectBtn');
//         if (connectBtn) {
//           connectBtn.addEventListener('click', function() {
//             handler.open();
//           });
//         }
        
//         // Change bank link
//         var changeBankLink = document.getElementById('changeBankLink');
//         if (changeBankLink) {
//           changeBankLink.addEventListener('click', function(e) {
//             e.preventDefault();
//             handler.open();
//           });
//         }
        
//         // Amount input - normal text input
//         var amountInput = document.getElementById('amountInput');
//         if (amountInput) {
//           // Prevent wheel events
//           amountInput.addEventListener('wheel', function(e) {
//             e.preventDefault();
//           });
          
//           amountInput.addEventListener('input', function() {
//             var value = this.value;
//             var parsedAmount = parseAmount(value);
            
//             // Update state
//             state.amount = parsedAmount;
            
//             // Don't reformat the input while typing - let user type naturally
//             // Only format on blur (when user leaves the field)
            
//             updateOrderSummary();
//             updateReviewRow();
//             validateForm();
//           });
          
//           // Format on blur (when user leaves the field)
//           amountInput.addEventListener('blur', function() {
//             if (state.amount > 0) {
//               this.value = formatAmount(state.amount);
//             }
//           });
          
//           // Allow user to clear the field
//           amountInput.addEventListener('focus', function() {
//             if (this.value === '0.00') {
//               this.value = '';
//             }
//           });
//         }
        
//         // Account select - controlled select
//         var accountSelect = document.getElementById('accountSelect');
//         if (accountSelect) {
//           accountSelect.addEventListener('change', function() {
//             state.selectedAccountId = this.value;
//             updateConnectedBadge();
//             updateReviewRow();
//             validateForm();
//           });
//         }
        
//         // Description input
//         var descriptionInput = document.getElementById('descriptionInput');
//         if (descriptionInput) {
//           descriptionInput.addEventListener('input', function() {
//             state.description = this.value;
//             updateReviewRow();
//           });
//         }
        
//         // Pay button
//         var payBtn = document.getElementById('payBtn');
//         if (payBtn) {
//           payBtn.addEventListener('click', function() {
//             if (state.isSubmitting || !validateForm()) return;
            
//             state.isSubmitting = true;
//             payBtn.disabled = true;
//             payBtn.innerHTML = '<span class="spinner"></span>Processing...';
            
//             var description = state.description || 'Gold purchase';
            
//             fetch('/api/transfers/create', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 user_id: USER_ID,
//                 account_id: state.selectedAccountId, // Use selected account ID
//                 amount: state.amount, // Send as decimal number
//                 description: description
//               })
//             })
//             .then(response => response.json())
//             .then(function(result) {
//               if (result.success) {
//                 // Show success view
//                 state.currentStep = 'success';
                
//                 var successAmount = document.getElementById('successAmount');
//                 var successAccount = document.getElementById('successAccount');
//                 var successDate = document.getElementById('successDate');
//                 // Remove successReference references
                
//                 var selected = getSelectedAccount();
//                 var accountName = selected ? (selected.name + ' ••••' + selected.mask) : 'Account';
                
//                 if (successAmount) successAmount.textContent = formatCurrency(state.amount);
//                 if (successAccount) successAccount.textContent = accountName;
//                 if (successDate) successDate.textContent = new Date().toLocaleDateString();
//                 // Remove reference ID display
                
//                 updateUI();
//               } else {
//                 alert('Payment failed: ' + (result.error || 'Unknown error'));
//                 state.isSubmitting = false;
//                 payBtn.disabled = false;
//                 payBtn.textContent = 'Complete payment';
//               }
//             })
//             .catch(function(error) {
//               console.error('Payment error:', error);
//               alert('Payment failed. Please try again.');
//               state.isSubmitting = false;
//               payBtn.disabled = false;
//               payBtn.textContent = 'Complete payment';
//             });
//           });
//         }
        
//         // New payment button
//         var newPaymentBtn = document.getElementById('newPaymentBtn');
//         if (newPaymentBtn) {
//           newPaymentBtn.addEventListener('click', function() {
//             // Reset state
//             state.isConnected = false;
//             state.currentStep = 'connect';
//             state.accounts = [];
//             state.selectedAccountId = null;
//             state.amount = 0;
//             state.description = '';
            
//             // Reset form
//             if (amountInput) amountInput.value = '';
//             if (descriptionInput) descriptionInput.value = '';
//             if (accountSelect) accountSelect.innerHTML = '<option value="">Choose an account...</option>';
            
//             updateOrderSummary();
//             updateUI();
//             validateForm();
//           });
//         }
//       });
//     })();
//   </script>
  
//   `
//       : ""
//   }
// </body>
// </html>`;
// }

// router.get("/", async (req, res, next) => {
//   try {
//     const cookies = parseCookies(req);
//     const sessionId = cookies["rg_link_session"];
//     const { selected_plan } = req.query;
    
//     // DEBUG: Log the URL parameters
//     console.log('🔍 DEBUG: req.query =', req.query);
//     console.log('🔍 DEBUG: selected_plan =', selected_plan);

//     if (!sessionId) {
//       return res.status(200).send(
//         renderPage({
//           linkToken: null,
//           error: "Your session expired. Please start again.",
//           userId: null,
//           selectedPlan: selected_plan || null
//         })
//       );
//     }

//     const session = await LinkSession.getById(sessionId);
//     const now = new Date();

//     if (!session || session.used || new Date(session.expires_at) < now) {
//       return res.status(200).send(
//         renderPage({
//           linkToken: null,
//           error: "Your session expired. Please start again.",
//           userId: null,
//           selectedPlan: selected_plan || null
//         })
//       );
//     }

//     // Issue a new link_token for THIS user
//     const linkToken = await plaidService.createLinkToken({
//       userId: session.user_id,
//       products: ["auth", "transfer"],
//       webhook: process.env.PLAID_WEBHOOK_URL || undefined,
//     });

//     // (Optional) Only mark used after link token creation succeeds
//     await LinkSession.markUsed(session.id);

//     return res.status(200).send(renderPage({ 
//         linkToken,
//         error: null,
//         userId: session.user_id,
//       selectedPlan: selected_plan || null
//     }));
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;
// console.log("Connect route loaded");


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
  
  .primary-action-btn { 
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
  
  .primary-action-btn:hover { 
    background: var(--rg-navy-600); 
  }
  
  .primary-action-btn:focus { 
    outline: none; 
    box-shadow: 0 0 0 4px var(--rg-navy-50), 0 4px 14px rgba(15, 39, 65, 0.18);
  }
  
  .primary-action-btn:disabled { 
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
  
  .review-row { 
    background: var(--rg-navy-50); 
    padding: 16px; 
    border-radius: 8px; 
    margin-bottom: 24px; 
    font-size: 14px; 
    color: var(--rg-ink);
    border: 1px solid var(--rg-border);
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
                  <div class="method-option" data-method="bank" data-testid="method-bank">
                    <input type="radio" name="payment-method" value="bank" class="method-radio">
                    <div class="method-icon">🏦</div>
                    <div class="method-content">
                      <div class="method-title">Bank account (Plaid)</div>
                      <div class="method-desc">Connect your bank account securely</div>
                    </div>
                  </div>
                  <div class="method-option" data-method="card" data-testid="method-card">
                    <input type="radio" name="payment-method" value="card" class="method-radio">
                    <div class="method-icon">💳</div>
                    <div class="method-content">
                      <div class="method-title">Credit/Debit card</div>
                      <div class="method-desc">Pay instantly with your credit or debit card</div>
                    </div>
                  </div>
                </div>

                <!-- Always-visible Amount and Description fields -->
                <div class="form-group">
                  <label class="form-label" for="amountInput" data-testid="amount-label">Amount</label>
                  <input 
                    type="text" 
                    id="amountInput" 
                    class="form-input" 
                    placeholder="0.00" 
                    inputmode="decimal"
                    data-testid="amount-input"
                    required
                  >
                  <div id="amountError" class="error-message hidden" data-testid="amount-error">Please enter a valid amount</div>
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="descriptionInput" data-testid="description-label">Description (optional)</label>
                  <input 
                    type="text" 
                    id="descriptionInput" 
                    class="form-input" 
                    placeholder="Gold Investment Plan"
                    data-testid="description-input"
                  >
                </div>

                <!-- Dynamic Primary Action Area -->
                <div id="primaryActionArea" data-testid="primary-action">
                  <!-- Content will be dynamically inserted here -->
                </div>

                <!-- Inline Error Area -->
                <div id="inlineError" class="error-message hidden" data-testid="inline-error"></div>

                <!-- Bank-specific sections (hidden by default) -->
                <div id="bankConnectedBadge" class="connected-badge hidden">
                  <div class="connected-icon">✓</div>
                  <div class="connected-text" id="connectedText">Bank connected</div>
                  <a href="#" id="changeBankLink" class="change-link">Change</a>
                </div>

                <div id="bankAccountSelect" class="form-group hidden">
                  <label class="form-label" for="accountSelect">Account</label>
                  <select id="accountSelect" class="form-select" required>
                    <option value="">Choose an account...</option>
                  </select>
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
                <div id="acceptUIContainer"></div>
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
      
      // State machine - single source of truth
      var state = {
        method: 'none', // 'none' | 'bank' | 'card'
        amount: '', // string (currency)
        isAmountValid: false,
        desc: '', // string
        cardFormReady: false,
        loading: false, // method-specific loading
        error: null, // string | null
        isConnected: false,
        accounts: [],
        selectedAccountId: null
      };
      
      // Debounce function for amount input
      function debounce(func, wait) {
        var timeout;
        return function executedFunction() {
          var later = function() {
            clearTimeout(timeout);
            func();
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
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
      
      // Format amount for display
      function formatAmount(amount) {
        return amount.toFixed(2);
      }
      
      // Format currency for display
      function formatCurrency(value) {
        return '$' + value.toFixed(2);
      }
      
      // Validate amount
      function validateAmount(value) {
        var parsed = parseAmount(value);
        return parsed > 0;
      }
      
      // Update order summary
      function updateOrderSummary() {
        var orderAmount = document.getElementById('orderAmount');
        var orderTotal = document.getElementById('orderTotal');
        var parsedAmount = parseAmount(state.amount);
        var formattedAmount = formatCurrency(parsedAmount);
        
        if (orderAmount) orderAmount.textContent = formattedAmount;
        if (orderTotal) orderTotal.textContent = formattedAmount;
      }
      
      // Update primary action area based on state
      function updatePrimaryAction() {
        var primaryActionArea = document.getElementById('primaryActionArea');
        var inlineError = document.getElementById('inlineError');
        
        if (!primaryActionArea) return;
        
        // Clear previous content
        primaryActionArea.innerHTML = '';
        
        // Clear error
        if (inlineError) {
          inlineError.classList.add('hidden');
          inlineError.textContent = '';
        }
        
        // Show appropriate button based on method and state
        if (state.method === 'bank') {
          if (state.isConnected) {
            // Show account selection and pay button
            var bankAccountSelect = document.getElementById('bankAccountSelect');
            if (bankAccountSelect) bankAccountSelect.classList.remove('hidden');
            
            var button = document.createElement('button');
            button.className = 'primary-action-btn';
            button.textContent = 'Complete payment';
            button.disabled = !state.isAmountValid || !state.selectedAccountId || state.loading;
            button.addEventListener('click', handleBankPayment);
            primaryActionArea.appendChild(button);
          } else {
            // Show connect button
            var button = document.createElement('button');
            button.className = 'primary-action-btn';
            button.textContent = 'Connect bank account';
            button.disabled = !state.isAmountValid || state.loading;
            button.addEventListener('click', handleBankConnect);
            primaryActionArea.appendChild(button);
          }
        } else if (state.method === 'card') {
          if (state.cardFormReady) {
            // Show card payment button
            var button = document.createElement('button');
            button.className = 'primary-action-btn AcceptUI';
            button.textContent = 'Pay with Credit Card';
            button.disabled = !state.isAmountValid || state.loading;
            // AcceptUI will handle the click event
            primaryActionArea.appendChild(button);
          } else {
            // Show loading state
            var loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = 'margin:8px 0; color:#64748b; text-align:center;';
            loadingDiv.innerHTML = '<span class="spinner"></span>Loading secure payment form…';
            loadingDiv.setAttribute('data-testid', 'loading-indicator');
            primaryActionArea.appendChild(loadingDiv);
          }
        }
        // If method === 'none', no button is shown
      }
      
      // Show inline error
      function showInlineError(message) {
        var inlineError = document.getElementById('inlineError');
        if (inlineError) {
          inlineError.textContent = message;
          inlineError.classList.remove('hidden');
        }
      }
      
      // Handle bank connection
      function handleBankConnect() {
        if (state.loading || !state.isAmountValid) return;
        
        state.loading = true;
        updatePrimaryAction();
        
        // Open Plaid Link
        if (window.handler) {
          window.handler.open();
        }
      }
      
      // Handle bank payment
      function handleBankPayment() {
        if (state.loading || !state.isAmountValid || !state.selectedAccountId) return;
        
        state.loading = true;
        updatePrimaryAction();
        
        var description = state.desc || 'Gold purchase';
        
        fetch('/api/transfers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: USER_ID,
            account_id: state.selectedAccountId,
            amount: parseAmount(state.amount),
            description: description
          })
        })
        .then(response => response.json())
        .then(function(result) {
          if (result.success) {
            showSuccessView();
          } else {
            showInlineError('Payment failed: ' + (result.error || 'Unknown error'));
            state.loading = false;
            updatePrimaryAction();
          }
        })
        .catch(function(error) {
          console.error('Payment error:', error);
          showInlineError('Payment failed. Please try again.');
          state.loading = false;
          updatePrimaryAction();
        });
      }
      
      // Show success view
      function showSuccessView() {
        var successView = document.getElementById('successView');
        var successAmount = document.getElementById('successAmount');
        var successAccount = document.getElementById('successAccount');
        var successDate = document.getElementById('successDate');
        
        var parsedAmount = parseAmount(state.amount);
        var accountName = state.method === 'bank' ? 
          (state.accounts.find(acc => acc.id === state.selectedAccountId)?.name + ' ••••' + 
           state.accounts.find(acc => acc.id === state.selectedAccountId)?.mask || 'Account') :
          'Credit Card';
        
        if (successAmount) successAmount.textContent = formatCurrency(parsedAmount);
        if (successAccount) successAccount.textContent = accountName;
        if (successDate) successDate.textContent = new Date().toLocaleDateString();
        
        if (successView) {
          successView.classList.remove('hidden');
          // Hide primary action area
          var primaryActionArea = document.getElementById('primaryActionArea');
          if (primaryActionArea) primaryActionArea.style.display = 'none';
        }
      }
      
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
              
              // Show connected badge
              var bankConnectedBadge = document.getElementById('bankConnectedBadge');
              if (bankConnectedBadge) bankConnectedBadge.classList.remove('hidden');
              
              // Auto-populate description if selectedPlan exists
              if (selectedPlan) {
                var descriptionInput = document.getElementById('descriptionInput');
                if (descriptionInput) {
                  descriptionInput.value = selectedPlan;
                  state.desc = selectedPlan;
                }
              }
              
              updateConnectedBadge();
              updatePrimaryAction();
            } else {
              showInlineError('Bank connection failed: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(function(error) {
            console.error('Exchange error:', error);
            showInlineError('Bank connection failed. Please try again.');
          })
          .finally(function() {
            state.loading = false;
            updatePrimaryAction();
          });
        },
        onExit: function(err, metadata) {
          console.log('Plaid Link exited:', err, metadata);
          state.loading = false;
          updatePrimaryAction();
        }
      });
      
      // Store handler globally for card payment access
      window.handler = handler;
      
      // Event listeners
      document.addEventListener('DOMContentLoaded', function() {
        // Auto-populate description if selectedPlan exists
        if (selectedPlan) {
          var descriptionInput = document.getElementById('descriptionInput');
          if (descriptionInput) {
            descriptionInput.value = selectedPlan;
            state.desc = selectedPlan;
          }
        }
        
        updatePrimaryAction();
        updateOrderSummary();
        
        // Payment method selection
        var methodOptions = document.querySelectorAll('.method-option');
        methodOptions.forEach(function(option) {
          option.addEventListener('click', function() {
            var method = this.dataset.method;
            
            // Update radio button
            var radio = this.querySelector('.method-radio');
            if (radio) radio.checked = true;
            
            // Update state
            state.method = method;
            
            // Update UI
            methodOptions.forEach(function(opt) {
              opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Show/hide bank-specific elements
            var bankAccountSelect = document.getElementById('bankAccountSelect');
            var bankConnectedBadge = document.getElementById('bankConnectedBadge');
            
            if (method === 'bank') {
              if (bankAccountSelect) bankAccountSelect.classList.remove('hidden');
              if (bankConnectedBadge && state.isConnected) bankConnectedBadge.classList.remove('hidden');
            } else {
              if (bankAccountSelect) bankAccountSelect.classList.add('hidden');
              if (bankConnectedBadge) bankConnectedBadge.classList.add('hidden');
            }
            
            updatePrimaryAction();
          });
        });
        
        // Amount input with debouncing
        var amountInput = document.getElementById('amountInput');
        if (amountInput) {
          var debouncedUpdate = debounce(function() {
            updateOrderSummary();
            updatePrimaryAction();
          }, 200);
          
          amountInput.addEventListener('input', function() {
            state.amount = this.value;
            state.isAmountValid = validateAmount(this.value);
            
            // Show/hide error
            var amountError = document.getElementById('amountError');
            if (amountError) {
              if (state.isAmountValid || this.value === '') {
                amountError.classList.add('hidden');
              } else {
                amountError.classList.remove('hidden');
              }
            }
            
            debouncedUpdate();
          });
          
          // Format on blur
          amountInput.addEventListener('blur', function() {
            var parsed = parseAmount(this.value);
            if (parsed > 0) {
              this.value = formatAmount(parsed);
            }
          });
          
          // Clear field on focus if it's 0.00
          amountInput.addEventListener('focus', function() {
            if (this.value === '0.00') {
              this.value = '';
            }
          });
        }
        
        // Description input
        var descriptionInput = document.getElementById('descriptionInput');
        if (descriptionInput) {
          descriptionInput.addEventListener('input', function() {
            state.desc = this.value;
          });
        }
        
        // Account select
        var accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
          accountSelect.addEventListener('change', function() {
            state.selectedAccountId = this.value;
            updateConnectedBadge();
            updatePrimaryAction();
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
        
        // New payment button
        var newPaymentBtn = document.getElementById('newPaymentBtn');
        if (newPaymentBtn) {
          newPaymentBtn.addEventListener('click', function() {
            // Reset state
            state.method = 'none';
            state.amount = '';
            state.isAmountValid = false;
            state.desc = '';
            state.cardFormReady = false;
            state.loading = false;
            state.error = null;
            state.isConnected = false;
            state.accounts = [];
            state.selectedAccountId = null;
            
            // Reset form
            if (amountInput) amountInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            if (accountSelect) accountSelect.innerHTML = '<option value="">Choose an account...</option>';
            
            // Reset UI
            methodOptions.forEach(function(opt) {
              opt.classList.remove('selected');
              var radio = opt.querySelector('.method-radio');
              if (radio) radio.checked = false;
            });
            
            var bankAccountSelect = document.getElementById('bankAccountSelect');
            var bankConnectedBadge = document.getElementById('bankConnectedBadge');
            var successView = document.getElementById('successView');
            var primaryActionArea = document.getElementById('primaryActionArea');
            
            if (bankAccountSelect) bankAccountSelect.classList.add('hidden');
            if (bankConnectedBadge) bankConnectedBadge.classList.add('hidden');
            if (successView) successView.classList.add('hidden');
            if (primaryActionArea) primaryActionArea.style.display = 'block';
            
            updateOrderSummary();
            updatePrimaryAction();
          });
        }
      });
      
      // Listen for AcceptUI ready state
      window.addEventListener('acceptUIReady', function(event) {
        state.cardFormReady = event.detail.ready;
        updatePrimaryAction();
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
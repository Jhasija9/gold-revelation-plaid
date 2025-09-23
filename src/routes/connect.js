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

// NOTE: add userId here
function renderPage({ linkToken, error, userId, bankConnected, connectedAccount }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Connect your bank</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a}
  .card{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(2,6,23,.08)}
  h1{font-size:20px;margin:0 0 8px}
  p{margin:8px 0 16px;color:#334155}
  button{appearance:none;border:0;border-radius:10px;padding:12px 16px;background:#0ea5e9;color:#fff;font-weight:600;cursor:pointer}
  .muted{color:#64748b;font-size:14px}
  .error{color:#b91c1c}
  .success{color:#059669}
  .logos{height:40px;background:linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9);border-radius:10px;margin:12px 0}
  .payment-form{display:none;margin-top:20px;padding:20px;background:#f8fafc;border-radius:10px}
  .form-group{margin-bottom:16px}
  .form-group label{display:block;margin-bottom:4px;font-weight:600;color:#374151}
  .form-group input{width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px}
  .form-group input:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.1)}
  .pay-btn{background:#059669;width:100%}
  .pay-btn:hover{background:#047857}
  .account-info{background:#f0f9ff;padding:12px;border-radius:8px;margin-bottom:16px;border-left:4px solid #0ea5e9}
  .form-group select{width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px}
  .form-group select:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.1)}
</style>
</head>
<body>
  <div class="card">
    <h1>Securely connect your bank</h1>
    <p class="muted">We use Plaid to connect your account. We never see or store your credentials.</p>
    ${
      error
        ? `
      <p class="error">${error}</p>
      <p><a href="/" class="muted">Session expired — start over</a></p>
    `
        : bankConnected
        ? `
  <div class="logos"></div>
  <button id="connectBtn">Connect bank</button>
  <p class="muted">If the window doesn't open, click the button again.</p>
  
  <!-- Always include these elements (hidden initially) -->
  <div class="account-info" id="accountInfo" style="display:none;">
    <p class="success">✅ Bank Account Connected Successfully!</p>
    <p><strong>Account:</strong> <span id="accountDetails">Loading...</span></p>
  </div>
  
  <div class="payment-form" id="paymentForm" style="display:none;">
    <h2>Complete Your Purchase</h2>
    <form id="paymentFormElement">
      <div class="form-group">
        <label for="account-select">Select Account:</label>
        <select id="account-select" required>
          <option value="">Choose an account...</option>
          <!-- Options will be populated by JavaScript -->
        </select>
      </div>
      <div class="form-group">
        <label for="amount">Amount ($):</label>
        <input type="number" id="amount" step="0.01" min="0.01" required placeholder="Enter amount">
      </div>
      <div class="form-group">
        <label for="description">Description:</label>
        <input type="text" id="description" required placeholder="What are you purchasing?">
      </div>
      <button type="submit" class="pay-btn">Pay Now</button>
    </form>
  </div>
`
        : `
  <div class="logos"></div>
  <button id="connectBtn">Connect bank</button>
  <p class="muted">If the window doesn't open, click the button again.</p>
  
  <!-- Always include these elements (hidden initially) -->
  <div class="account-info" id="accountInfo" style="display:none;">
    <p class="success">✅ Bank Account Connected Successfully!</p>
    <p><strong>Account:</strong> <span id="accountDetails">Loading...</span></p>
  </div>
  
  <div class="payment-form" id="paymentForm" style="display:none;">
    <h2>Complete Your Purchase</h2>
    <form id="paymentFormElement">
      <div class="form-group">
        <label for="account-select">Select Account:</label>
        <select id="account-select" required>
          <option value="">Choose an account...</option>
          <!-- Options will be populated by JavaScript -->
        </select>
      </div>
      <div class="form-group">
        <label for="amount">Amount ($):</label>
        <input type="number" id="amount" step="0.01" min="0.01" required placeholder="Enter amount">
      </div>
      <div class="form-group">
        <label for="description">Description:</label>
        <input type="text" id="description" required placeholder="What are you purchasing?">
      </div>
      <button type="submit" class="pay-btn">Pay Now</button>
    </form>
  </div>
`
    }
  </div>

  ${
    linkToken
      ? `
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    (function(){
      var USER_ID = ${JSON.stringify(userId ?? null)};
      var CONNECTED_ACCOUNT = ${JSON.stringify(connectedAccount ?? null)};
      
      var handler = Plaid.create({
        token: ${JSON.stringify(linkToken)},
        onSuccess: function(public_token, metadata) {
          console.log('PUBLIC TOKEN:', public_token, metadata);
          
          fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_token: public_token,
              user_id: USER_ID
            })
          })
          .then(response => response.json())
          .then(data => {
            console.log('Exchange result:', data);
            if (data.success) {
              // Store accounts globally so form submission can access them
              window.ACCOUNTS_DATA = data.accounts;
              
              // Show payment form
              var paymentForm = document.getElementById('paymentForm');
              var connectBtn = document.getElementById('connectBtn');
              
              if (paymentForm) {
                paymentForm.style.display = 'block';
              }
              if (connectBtn) {
                connectBtn.style.display = 'none';
              }
              
              // Update account info
              var accountInfo = document.getElementById('accountInfo');
              if (accountInfo) {
                accountInfo.style.display = 'block';
                document.getElementById('accountDetails').textContent = metadata.institution.name + ' - ' + metadata.accounts[0].name;
              }
              
              // Populate account dropdown
              var accountSelect = document.getElementById('account-select');
              if (accountSelect && data.accounts) {
                data.accounts.forEach(account => {
                  var option = document.createElement('option');
                  option.value = account.id; // This is the real UUID
                  option.textContent = account.name + ' (' + account.type + ') - ****' + account.mask;
                  accountSelect.appendChild(option);
                });
              }
            } else {
              alert('Bank connection failed: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Bank connection failed. Please try again.');
          });
        },
        onExit: function(err, metadata) {
          console.log('Plaid Link exited:', err, metadata);
        }
      });
      
      // Add event listener - CHECK IF ELEMENT EXISTS FIRST
      var connectBtn = document.getElementById('connectBtn');
      if (connectBtn) {
        connectBtn.addEventListener('click', function() {
          handler.open();
        });
      }
      
      // Payment form submission - CHECK IF ELEMENT EXISTS FIRST
      var paymentFormElement = document.getElementById('paymentFormElement');
      if (paymentFormElement) {
        paymentFormElement.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          var amount = document.getElementById('amount');
          var description = document.getElementById('description');
          var accountSelect = document.getElementById('account-select');

          if (!amount || !description || !accountSelect) {
            alert('Form elements not found');
            return;
          }

          if (!amount.value || amount.value <= 0) {
            alert('Please enter a valid amount');
            return;
          }

          if (!accountSelect.value || accountSelect.value === 'undefined' || accountSelect.value === '') {
            alert('Please select an account');
            return;
          }

          console.log('Selected account ID:', accountSelect.value);
          console.log('Available accounts:', window.ACCOUNTS_DATA);
          
          try {
            var response = await fetch('/api/transfers/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: USER_ID,
                account_id: document.getElementById('account-select').value, // Real account ID
                amount: parseFloat(amount.value),
                description: description.value
              })
            });
            
            var result = await response.json();
            
            if (result.success) {
              // Don't open a new window - transfer is already processed
              alert('Payment submitted successfully! Transfer ID: ' + result.transfer_id);
              // Optionally redirect or show success page
            } else {
              alert('Payment failed: ' + (result.error || 'Unknown error'));
            }
          } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
          }
        });
      }
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
          userId: null, // include to avoid template ReferenceError
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
      userId: session.user_id, // ensure plaidService maps this to user.user_id string
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
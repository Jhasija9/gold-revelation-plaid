// // src/routes/connect.js
// const express = require("express");
// const router = express.Router();
// const cookie = require("cookie");

// const LinkSession = require("../models/LinkSession");
// const plaidService = require("../services/plaidService"); // you already have this

// function parseCookies(req) {
//   const header = req.headers.cookie || "";
//   return cookie.parse(header);
// }

// function renderPage({ linkToken, error }) {
//   return `<!doctype html>
// <html lang="en">
// <head>
// <meta charset="utf-8"/>
// <meta name="viewport" content="width=device-width,initial-scale=1"/>
// <title>Connect your bank</title>
// <style>
//   body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a}
//   .card{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(2,6,23,.08)}
//   h1{font-size:20px;margin:0 0 8px}
//   p{margin:8px 0 16px;color:#334155}
//   button{appearance:none;border:0;border-radius:10px;padding:12px 16px;background:#0ea5e9;color:#fff;font-weight:600;cursor:pointer}
//   .muted{color:#64748b;font-size:14px}
//   .error{color:#b91c1c}
//   .logos{height:40px;background:linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9);border-radius:10px;margin:12px 0}
// </style>
// </head>
// <body>
//   <div class="card">
//     <h1>Securely connect your bank</h1>
//     <p class="muted">We use Plaid to connect your account. We never see or store your credentials.</p>
//     ${
//       error
//         ? `
//       <p class="error">${error}</p>
//       <p><a href="/" class="muted">Session expired — start over</a></p>
//     `
//         : `
//       <div class="logos"></div>
//       <button id="connectBtn">Connect bank</button>
//       <p class="muted">If the window doesn't open, click the button again.</p>
//     `
//     }
//   </div>

//   ${
//     linkToken
//       ? `
//   <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
//   <script>
//     (function(){
//       var USER_ID = ${JSON.stringify(userId ?? null)};
//       var handler = Plaid.create({
//         token: ${JSON.stringify(linkToken)},
//         onSuccess: function(public_token, metadata) {
//             console.log('PUBLIC TOKEN:', public_token, metadata);

//           // Phase 2: we'll POST to /api/plaid/exchange-token and then show masked confirmation.
//           fetch('/api/plaid/exchange-token', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             credentials: 'include',
//             body: JSON.stringify({
//               public_token: public_token,
//               user_id: USER_ID,
//               account_id: metadata?.accounts?.[0]?.id
//             })
//           })
//           .then(r => r.json())
//           .then(() => alert('Connected!'))
//           .catch(() => alert('Exchange failed. Please try again.'));
//         },
//         onExit: function(err) {
//           if (err) console.warn('Plaid exit', err);
//         }
//       });

//       document.getElementById('connectBtn').addEventListener('click', function(){ handler.open(); });
//       window.addEventListener('load', function(){ handler.open(); });
//     })();
//   </script>`
//       : ``
//   }
// </body>
// </html>`;
// }

// router.get("/", async (req, res, next) => {
//   try {
//     const cookies = parseCookies(req);
//     const sessionId = cookies["rg_link_session"];

//     if (!sessionId) {
//       return res.status(200).send(
//         renderPage({
//           linkToken: null,
//           error: "Your session expired. Please start again.",
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
//         })
//       );
//     }

//     // Prevent replay
//     await LinkSession.markUsed(session.id);

//     // Mint a fresh plaind link_token for this user
//     const linkToken = await plaidService.createLinkToken({
//       userId: session.user_id,
//       products: ["auth"],
//       webhook: process.env.PLAID_WEBHOOK_URL || undefined,
//     });

//     return res.status(200).send(renderPage({ linkToken, error: null }));
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;

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
function renderPage({ linkToken, error, userId }) {
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
  .logos{height:40px;background:linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9);border-radius:10px;margin:12px 0}
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
        : `
      <div class="logos"></div>
      <button id="connectBtn">Connect bank</button>
      <p class="muted">If the window doesn't open, click the button again.</p>
    `
    }
  </div>

  ${
    linkToken
      ? `
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    (function(){
      // SAFELY inline userId — no ReferenceError even if null
      var USER_ID = ${JSON.stringify(userId ?? null)};
      var handler = Plaid.create({
        token: ${JSON.stringify(linkToken)},
        onSuccess: function(public_token, metadata) {
          
          fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              public_token: public_token,
              user_id: USER_ID,
              account_id: metadata?.accounts?.[0]?.id
            })
          })
          .then(r => r.json())
          .then(() => alert('Connected!'))
          .catch(() => alert('Exchange failed. Please try again.'));
        },
        onExit: function(err) {
          if (err) console.warn('Plaid exit', err);
        }
      });

      document.getElementById('connectBtn')?.addEventListener('click', function(){ handler.open(); });
      window.addEventListener('load', function(){ handler.open(); });
    })();
  </script>`
      : ``
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
      products: ["auth"],
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

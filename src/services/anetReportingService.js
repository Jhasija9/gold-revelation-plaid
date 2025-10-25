// src/services/anetReportingService.js
const { APIContracts, APIControllers } = require('authorizenet');

function makeMerchantAuth() {
  const auth = new APIContracts.MerchantAuthenticationType();
  auth.setName(process.env.ANET_API_LOGIN_ID);
  auth.setTransactionKey(process.env.ANET_TRANSACTION_KEY);
  return auth;
}

function getApiEnvironment() {
  // 'sandbox' | 'production'
  return (process.env.ANET_ENV || 'sandbox').toLowerCase() === 'production'
    ? APIContracts.endpoint.production
    : APIContracts.endpoint.sandbox;
}

function getTransactionDetails(transId) {
  return new Promise((resolve, reject) => {
    const request = new APIContracts.GetTransactionDetailsRequest();
    request.setMerchantAuthentication(makeMerchantAuth());
    request.setTransId(String(transId));

    const ctrl = new APIControllers.GetTransactionDetailsController(request.getJSON());
    ctrl.setEnvironment(getApiEnvironment());

    ctrl.execute(() => {
      try {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.GetTransactionDetailsResponse(apiResponse);

        const ok = response != null &&
                   response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK;

        if (!ok) {
          const msg = response?.getMessages()?.getMessage?.()[0]?.getText?.() || 'Unknown error';
          return reject(new Error(`getTransactionDetails failed: ${msg}`));
        }

        const tx = response.getTransaction();
        // Normalize the few fields we need
        const subscription = tx.getSubscription
          ? tx.getSubscription()
          : undefined;

          resolve({
            transId: tx.getTransId?.(),
            status: tx.getTransactionStatus?.(),
            authCode: tx.getAuthCode?.(),
            responseCode: tx.getResponseCode?.(),
            amount: tx.getAuthAmount?.() || tx.getSettleAmount?.(),
            subscription: subscription
              ? {
                  id: subscription.getId?.(),
                  payNum: subscription.getPayNum?.(),
                }
              : null,
            invoiceNumber: tx.getOrder?.()?.getInvoiceNumber?.(),   // <-- add
            customerProfileId: tx.getProfile?.()?.getCustomerProfileId?.(),
            customerPaymentProfileId: tx.getProfile?.()?.getCustomerPaymentProfileId?.(),
            billingEmail: tx.getCustomer?.()?.getEmail?.(),
            billingFirstName: tx.getBillTo?.()?.getFirstName?.(),
            billingLastName: tx.getBillTo?.()?.getLastName?.(),
          });
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { getTransactionDetails };

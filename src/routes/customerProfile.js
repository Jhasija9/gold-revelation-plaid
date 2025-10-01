const express = require("express");
const customerProfileController = require("../controllers/customerProfileController");

const router = express.Router();

// Customer profile routes - NO AUTH like Plaid
router.post(
  "/create",
  customerProfileController.createCustomerProfile.bind(customerProfileController)
);

router.get(
  "/:customerId",
  customerProfileController.getCustomerProfile.bind(customerProfileController)
);

router.post(
  "/:customerId/payment-profile",
  customerProfileController.createPaymentProfile.bind(customerProfileController)
);

router.get(
  "/:customerId/payment-profiles",
  customerProfileController.getPaymentProfiles.bind(customerProfileController)
);

router.delete(
  "/:customerId/payment-profile/:paymentProfileId",
  customerProfileController.deletePaymentProfile.bind(customerProfileController)
);

module.exports = router;

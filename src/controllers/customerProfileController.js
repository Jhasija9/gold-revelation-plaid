const customerProfileService = require('../services/customerProfileService');
const databaseService = require('../services/databaseService');
const AuthorizeNetHelpers = require('../utils/authorizeNetHelpers');

class CustomerProfileController {
  // Create customer profile
  async createCustomerProfile(req, res) {
    try {
      console.log('=== CREATE CUSTOMER PROFILE ===');
      console.log('req.body:', req.body);

      const {
        user_id,
        email,
        firstName,
        lastName,
        phoneNumber,
        address
      } = req.body;

      // Validate required fields
      if (!user_id || !email || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'user_id, email, firstName, and lastName are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      // Check if user already has a customer profile
      const existingProfileResult = await databaseService.query('users', 'select', {
        where: { customer_profile_id: { not: null } }
      });

      if (existingProfileResult.success && existingProfileResult.data.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'User already has a customer profile'
        });
      }

      // Create customer profile data
      const customerData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        address: address
      };

      // Create customer profile through Authorize.Net
      const profileResult = await customerProfileService.createCustomerProfile(customerData);

      if (!profileResult.success) {
        return res.status(400).json({
          success: false,
          error: profileResult.error,
          responseCode: profileResult.responseCode
        });
      }

      // Update user record with customer profile ID
      const updateResult = await databaseService.query('users', 'update', {
        where: { id: user_id },
        values: { customer_profile_id: profileResult.customerProfileId }
      });

      if (!updateResult.success) {
        console.error('Failed to update user with customer profile ID:', updateResult.error);
      }

      res.json({
        success: true,
        customerProfileId: profileResult.customerProfileId,
        message: 'Customer profile created successfully'
      });

    } catch (error) {
      console.error('Create customer profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Save customer card
  async saveCustomerCard(req, res) {
    try {
      console.log('=== SAVE CUSTOMER CARD ===');
      console.log('req.body:', req.body);

      const {
        user_id,
        cardNumber,
        expirationDate,
        cvv,
        firstName,
        lastName,
        address
      } = req.body;

      // Validate required fields
      if (!user_id || !cardNumber || !expirationDate || !cvv) {
        return res.status(400).json({
          success: false,
          error: 'user_id, cardNumber, expirationDate, and cvv are required'
        });
      }

      // Validate card details
      if (!AuthorizeNetHelpers.validateCardNumber(cardNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid card number'
        });
      }

      if (!AuthorizeNetHelpers.validateExpirationDate(expirationDate)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expiration date format (MM/YY)'
        });
      }

      if (!AuthorizeNetHelpers.validateCVV(cvv)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CVV'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      if (!user.customer_profile_id) {
        return res.status(400).json({
          success: false,
          error: 'User must have a customer profile to save cards'
        });
      }

      // Prepare payment data
      const paymentData = {
        cardNumber: cardNumber.replace(/\D/g, ''),
        expirationDate: expirationDate,
        cvv: cvv,
        firstName: firstName || user.first_name,
        lastName: lastName || user.last_name,
        address: address
      };

      // Create payment profile through Authorize.Net
      const paymentProfileResult = await customerProfileService.createCustomerPaymentProfile(
        user.customer_profile_id,
        paymentData
      );

      if (!paymentProfileResult.success) {
        return res.status(400).json({
          success: false,
          error: paymentProfileResult.error,
          responseCode: paymentProfileResult.responseCode
        });
      }

      res.json({
        success: true,
        customerPaymentProfileId: paymentProfileResult.customerPaymentProfileId,
        message: 'Card saved successfully',
        cardLastFour: cardNumber.slice(-4),
        cardType: AuthorizeNetHelpers.getCardType(cardNumber)
      });

    } catch (error) {
      console.error('Save customer card error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get customer profile
  async getCustomerProfile(req, res) {
    try {
      const { user_id } = req.params;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      if (!user.customer_profile_id) {
        return res.status(404).json({
          success: false,
          error: 'User does not have a customer profile'
        });
      }

      // Get customer profile from Authorize.Net
      const profileResult = await customerProfileService.getCustomerProfile(user.customer_profile_id);

      if (!profileResult.success) {
        return res.status(400).json({
          success: false,
          error: profileResult.error,
          responseCode: profileResult.responseCode
        });
      }

      res.json({
        success: true,
        profile: profileResult.profile,
        message: 'Customer profile retrieved successfully'
      });

    } catch (error) {
      console.error('Get customer profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get saved cards
  async getSavedCards(req, res) {
    try {
      const { user_id } = req.params;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      if (!user.customer_profile_id) {
        return res.status(404).json({
          success: false,
          error: 'User does not have a customer profile'
        });
      }

      // Get customer profile to get payment profiles
      const profileResult = await customerProfileService.getCustomerProfile(user.customer_profile_id);

      if (!profileResult.success) {
        return res.status(400).json({
          success: false,
          error: profileResult.error,
          responseCode: profileResult.responseCode
        });
      }

      const profile = profileResult.profile;
      const savedCards = [];

      // Extract payment profiles
      if (profile.paymentProfiles && profile.paymentProfiles.paymentProfile) {
        const paymentProfiles = Array.isArray(profile.paymentProfiles.paymentProfile) 
          ? profile.paymentProfiles.paymentProfile 
          : [profile.paymentProfiles.paymentProfile];

        paymentProfiles.forEach(paymentProfile => {
          if (paymentProfile.payment && paymentProfile.payment.creditCard) {
            const creditCard = paymentProfile.payment.creditCard;
            savedCards.push({
              paymentProfileId: paymentProfile.customerPaymentProfileId,
              cardLastFour: creditCard.cardNumber.slice(-4),
              cardType: AuthorizeNetHelpers.getCardType(creditCard.cardNumber),
              expirationDate: creditCard.expirationDate,
              isDefault: paymentProfile.defaultPaymentProfile === 'true'
            });
          }
        });
      }

      res.json({
        success: true,
        savedCards: savedCards,
        count: savedCards.length,
        message: 'Saved cards retrieved successfully'
      });

    } catch (error) {
      console.error('Get saved cards error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Delete saved card
  async deleteSavedCard(req, res) {
    try {
      const { user_id, payment_profile_id } = req.params;

      if (!user_id || !payment_profile_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id and payment_profile_id are required'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      if (!user.customer_profile_id) {
        return res.status(404).json({
          success: false,
          error: 'User does not have a customer profile'
        });
      }

      // Delete payment profile through Authorize.Net
      const deleteResult = await customerProfileService.deleteCustomerPaymentProfile(
        user.customer_profile_id,
        payment_profile_id
      );

      if (!deleteResult.success) {
        return res.status(400).json({
          success: false,
          error: deleteResult.error,
          responseCode: deleteResult.responseCode
        });
      }

      res.json({
        success: true,
        message: 'Card deleted successfully'
      });

    } catch (error) {
      console.error('Delete saved card error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new CustomerProfileController();

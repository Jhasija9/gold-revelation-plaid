const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;
const MerchantAuthenticationType = ApiContracts.MerchantAuthenticationType;
const CreateCustomerProfileRequest = ApiContracts.CreateCustomerProfileRequest;
const CustomerProfileType = ApiContracts.CustomerProfileType;
const CustomerPaymentProfileType = ApiContracts.CustomerPaymentProfileType;
const PaymentType = ApiContracts.PaymentType;
const CreditCardType = ApiContracts.CreditCardType;
const CustomerAddressType = ApiContracts.CustomerAddressType;
const GetCustomerProfileRequest = ApiContracts.GetCustomerProfileRequest;
const DeleteCustomerProfileRequest = ApiContracts.DeleteCustomerProfileRequest;
const CreateCustomerPaymentProfileRequest = ApiContracts.CreateCustomerPaymentProfileRequest;
const GetCustomerPaymentProfileRequest = ApiContracts.GetCustomerPaymentProfileRequest;
const DeleteCustomerPaymentProfileRequest = ApiContracts.DeleteCustomerPaymentProfileRequest;
const Environment = Constants.Environment;

class CustomerProfileService {
  constructor() {
    
    this.apiLoginId = process.env.ANET_API_LOGIN_ID;
    this.signatureKey = process.env.ANET_SIGNATURE_KEY;
    this.environment = process.env.ANET_ENV === 'production' 
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox;
  }

  // Create merchant authentication
  getMerchantAuthentication() {
    const merchantAuthenticationType = new MerchantAuthenticationType();
    merchantAuthenticationType.setName(this.apiLoginId);
    merchantAuthenticationType.setTransactionKey(this.signatureKey);
    return merchantAuthenticationType;
  }

  // Create customer profile
  async createCustomerProfile(customerData) {
    try {
      const {
        email,
        firstName,
        lastName,
        phoneNumber,
        address
      } = customerData;

      // Create customer profile
      const customerProfile = new CustomerProfileType();
      customerProfile.setMerchantCustomerId(email); // Use email as unique ID
      customerProfile.setEmail(email);
      customerProfile.setDescription(`Customer profile for ${firstName} ${lastName}`);

      // Create customer address if provided
      if (address) {
        const customerAddress = new CustomerAddressType();
        customerAddress.setFirstName(firstName);
        customerAddress.setLastName(lastName);
        customerAddress.setAddress(address.street);
        customerAddress.setCity(address.city);
        customerAddress.setState(address.state);
        customerAddress.setZip(address.zipCode);
        customerAddress.setCountry(address.country || 'USA');
        customerAddress.setPhoneNumber(phoneNumber);
        customerProfile.setBillTo(customerAddress);
      }

      // Create the request
      const createRequest = new CreateCustomerProfileRequest();
      createRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      createRequest.setProfile(customerProfile);

      // Execute the request
      const ctrl = new ApiControllers.CreateCustomerProfileController(createRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              customerProfileId: response.customerProfileId,
              customerPaymentProfileIdList: response.customerPaymentProfileIdList,
              message: 'Customer profile created successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to create customer profile',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

    } catch (error) {
      console.error('Customer profile creation error:', error);
      return {
        success: false,
        error: error.message || 'Customer profile creation failed'
      };
    }
  }

  // Get customer profile
  async getCustomerProfile(customerProfileId) {
    try {
      const getRequest = new GetCustomerProfileRequest();
      getRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      getRequest.setCustomerProfileId(customerProfileId);

      const ctrl = new ApiControllers.GetCustomerProfileController(getRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              profile: response.profile,
              message: 'Customer profile retrieved successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to get customer profile',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

    } catch (error) {
      console.error('Get customer profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get customer profile'
      };
    }
  }

  // Create customer payment profile (save card)
  async createCustomerPaymentProfile(customerProfileId, paymentData) {
    try {
      const {
        cardNumber,
        expirationDate,
        cvv,
        firstName,
        lastName,
        address
      } = paymentData;

      // Create credit card
      const creditCard = new CreditCardType();
      creditCard.setCardNumber(cardNumber);
      creditCard.setExpirationDate(expirationDate);
      creditCard.setCardCode(cvv);

      // Create payment type
      const paymentType = new PaymentType();
      paymentType.setCreditCard(creditCard);

      // Create payment profile
      const paymentProfile = new CustomerPaymentProfileType();
      paymentProfile.setCustomerType('individual');
      paymentProfile.setPayment(paymentType);

      // Set billing address if provided
      if (address) {
        const billTo = new CustomerAddressType();
        billTo.setFirstName(firstName);
        billTo.setLastName(lastName);
        billTo.setAddress(address.street);
        billTo.setCity(address.city);
        billTo.setState(address.state);
        billTo.setZip(address.zipCode);
        billTo.setCountry(address.country || 'USA');
        paymentProfile.setBillTo(billTo);
      }

      // Create the request
      const createRequest = new CreateCustomerPaymentProfileRequest();
      createRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      createRequest.setCustomerProfileId(customerProfileId);
      createRequest.setPaymentProfile(paymentProfile);

      const ctrl = new ApiControllers.CreateCustomerPaymentProfileController(createRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              customerPaymentProfileId: response.customerPaymentProfileId,
              message: 'Payment profile created successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to create payment profile',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

    } catch (error) {
      console.error('Create payment profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment profile'
      };
    }
  }

  // Get customer payment profile
  async getCustomerPaymentProfile(customerProfileId, paymentProfileId) {
    try {
      const getRequest = new GetCustomerPaymentProfileRequest();
      getRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      getRequest.setCustomerProfileId(customerProfileId);
      getRequest.setCustomerPaymentProfileId(paymentProfileId);

      const ctrl = new ApiControllers.GetCustomerPaymentProfileController(getRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              paymentProfile: response.paymentProfile,
              message: 'Payment profile retrieved successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to get payment profile',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

    } catch (error) {
      console.error('Get payment profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get payment profile'
      };
    }
  }

  // Delete customer payment profile
  async deleteCustomerPaymentProfile(customerProfileId, paymentProfileId) {
    try {
      const deleteRequest = new DeleteCustomerPaymentProfileRequest();
      deleteRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      deleteRequest.setCustomerProfileId(customerProfileId);
      deleteRequest.setCustomerPaymentProfileId(paymentProfileId);

      const ctrl = new ApiControllers.DeleteCustomerPaymentProfileController(deleteRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              message: 'Payment profile deleted successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to delete payment profile',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

    } catch (error) {
      console.error('Delete payment profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete payment profile'
      };
    }
  }

  // Delete customer profile
  async deleteCustomerProfile(customerProfileId) {
    try {
      const deleteRequest = new DeleteCustomerProfileRequest();
      deleteRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      deleteRequest.setCustomerProfileId(customerProfileId);

      const ctrl = new ApiControllers.DeleteCustomerProfileController(deleteRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              message: 'Customer profile deleted successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to delete customer profile',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

    } catch (error) {
      console.error('Delete customer profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete customer profile'
      };
    }
  }
}

module.exports = new CustomerProfileService();

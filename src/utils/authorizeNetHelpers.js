const crypto = require('crypto');

class AuthorizeNetHelpers {
  // Generate signature for webhook verification
  static generateSignature(payload, signatureKey) {
    try {
      const hash = crypto.createHmac('sha512', signatureKey)
        .update(payload, 'utf8')
        .digest('hex');
      return hash;
    } catch (error) {
      console.error('Signature generation error:', error);
      return null;
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(payload, signature, signatureKey) {
    try {
      const expectedSignature = this.generateSignature(payload, signatureKey);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Format amount for Authorize.Net
  static formatAmount(amount) {
    return parseFloat(amount).toFixed(2);
  }

  // Validate card number
  static validateCardNumber(cardNumber) {
    const number = cardNumber.replace(/\D/g, '');
    return number.length >= 13 && number.length <= 19;
  }

  // Validate expiration date
  static validateExpirationDate(expirationDate) {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    return regex.test(expirationDate);
  }

  // Validate CVV
  static validateCVV(cvv) {
    const regex = /^\d{3,4}$/;
    return regex.test(cvv);
  }

  // Format card number for display (show only last 4 digits)
  static maskCardNumber(cardNumber) {
    if (!cardNumber) return '';
    const number = cardNumber.replace(/\D/g, '');
    return '****-****-****-' + number.slice(-4);
  }

  // Get card type from number
  static getCardType(cardNumber) {
    const number = cardNumber.replace(/\D/g, '');
    
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    if (number.startsWith('6')) return 'Discover';
    
    return 'Unknown';
  }
}

module.exports = AuthorizeNetHelpers;

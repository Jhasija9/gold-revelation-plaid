const validation = {
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate required fields
  validateRequired: (data, requiredFields) => {
    const missing = [];
    requiredFields.forEach(field => {
      if (!data[field]) {
        missing.push(field);
      }
    });
    return missing;
  },

  // Validate amount
  isValidAmount: (amount) => {
    return !isNaN(amount) && amount > 0;
  },

  // Validate UUID
  isValidUUID: (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};

module.exports = validation;

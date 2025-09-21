const crypto = require('crypto');

// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const RAW_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const KEY = crypto.createHash('sha256').update(String(RAW_KEY)).digest();
const ALGORITHM = 'aes-256-gcm';

const encryptToken = (text) => {
  // const iv = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  // const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decryptToken = (encryptedData) => {
  // const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  const decipher = crypto.createDecipheriv(
   ALGORITHM,
   KEY,
   Buffer.from(encryptedData.iv, 'hex')
 );
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

module.exports = {
  encryptToken,
  decryptToken
};

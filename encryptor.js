const crypto = require('crypto');

function encrypt(text, apiKey) {
  const key = crypto.createHash('sha256').update(apiKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const ivBase64 = iv.toString('base64');
  return `${ivBase64}:${encrypted}`;
}

function decrypt(encryptedData, apiKey) {
  const [ivBase64, encrypted] = encryptedData.split(':');
  const key = crypto.createHash('sha256').update(apiKey).digest();
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };

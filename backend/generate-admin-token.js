import crypto from 'crypto';

// Generate a secure random token for admin login
const generateAdminToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate and display the token
const adminToken = generateAdminToken();
console.log('Generated Admin Token:', adminToken);
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_API_TOKEN=${adminToken}`);
console.log('\nUse this token in the AdminLogin component to access the admin portal.');

export { generateAdminToken };

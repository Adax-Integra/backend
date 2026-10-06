//testing email service for password recovery

import MailerService from '../data/Services/mailer.service.js';

//enter email to be sent to, and test sending email
const email = 'email-example';
const testToken = 'test-token';

try {
  console.log('Starting email service test...');

  await MailerService.sendPasswordRecoveryEmail(email, testToken);
  console.log('Email service test completed successfully.');
} catch (error) {
  console.error('Email service test failed:', error.message);
}

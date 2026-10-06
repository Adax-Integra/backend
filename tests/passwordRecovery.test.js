//tests for password recovery

//tests for password recovery model
import PasswordRecoveryModel from '../data/models/passwordRecovery.model.js';

//user functions within the model

//const userId = 'test-user-id';

//check if a recovery record exists for the user
/*try {
    const recovery = await PasswordRecoveryModel.findByUserId(userId);

    if (recovery) {
        console.log('Recovery record found:');
        console.log(recovery);
    } else {
        console.log('No recovery record found for this user.');
    }
} catch (error) {
    console.error('Error testing PasswordRecoveryModel:', error.message);
}*/

//test inserting a new recovery record for the user
/*try {
    console.log('Starting insert...');

    const recovery = await PasswordRecoveryModel.createRecoveryRecord(
        userId,
        'test-hash',
        new Date(Date.now() + 60 * 60 * 1000).toISOString()
    );

    console.log('INSERT SUCCESSFUL');
    console.log(recovery);
} catch (error) {
    console.error('INSERT FAILED');
    console.error(error);
}*/

//update the existing record using record id
/*try {
  const recovery = await PasswordRecoveryModel.updateRecoveryRecord(
    'test-recovery-id',
    'new-test-hash',
    new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );

  console.log('Recovery record updated:');
  console.log(recovery);
} catch (error) {
  console.error('Error updating recovery record:', error.message);
}*/

//--------------------------------------------------------------------------

//mark the token as used
//this should be done after the user successfully resets their password
const result = await PasswordRecoveryModel.markTokenAsUsed('test-recovery-id');

console.log(result);

//test upon receiving raw token
//import crypto from 'crypto';

const recoveryToken = 'test-token';

/*const tokenHash = crypto
    .createHash('sha256')
    .update(recoveryToken)
    .digest('hex');*/

/*try {
    console.log('Searching for recovery token...');

    const recovery = await PasswordRecoveryModel.findByToken(tokenHash);

    console.log('Result:');
    console.log(recovery);

} catch (error) {
    console.error('Token lookup failed:');
    console.error(error);
}*/

//---------------------------------------------------------------------------
//test use case for password recovery
import PasswordRecoveryUseCase from '../domain/useCases/passwordRecovery.usecase.js';

const useCase = new PasswordRecoveryUseCase();

//replace w valid email
/*const email = 'test-email';

//should create a hashed token and store it in the password recovery table, or update an existing record if one exists for the user
try {
  console.log('Starting password recovery test...');
  const result = await useCase.forgotPassword(email);

  console.log('PASSWORD RECOVERY SUCCESSFUL');
  console.log(result);
} catch (error) {
  console.error('PASSWORD RECOVERY FAILED');
  console.error(error);
}*/

try {
  console.log('Validating recovery token...');

  const result = await useCase.validateToken(recoveryToken);

  console.log('TOKEN VALID');
  console.log(result);
} catch (error) {
  console.error('TOKEN INVALID');
  console.error(error.message);
}

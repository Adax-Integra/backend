//tests to see if password recovery model is working properly

import PasswordRecoveryModel from '../data/models/passwordRecovery.model.js';

//const userId = 'f3c972df-d0ae-4099-b088-02e4180b949f';

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
try {
  const recovery = await PasswordRecoveryModel.updateRecoveryRecord(
    '95868e52-dc92-421c-a466-634d79a55ff2',
    'new-test-hash',
    new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );

  console.log('Recovery record updated:');
  console.log(recovery);
} catch (error) {
  console.error('Error updating recovery record:', error.message);
}

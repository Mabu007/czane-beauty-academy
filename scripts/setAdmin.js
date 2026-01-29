/**
 * ============================================================================
 * FIREBASE ADMIN SETUP & RUN INSTRUCTIONS
 * ============================================================================
 * 
 * PRE-REQUISITES:
 * 1. Node.js installed on your machine.
 * 2. Access to the Firebase Console for project "czane-c3786".
 * 
 * SETUP:
 * 1. Open a terminal in this 'scripts' folder.
 * 2. Initialize a package.json (if not exists) and install the admin SDK:
 *    $ npm init -y
 *    $ npm install firebase-admin
 * 
 * 3. Download your Service Account Key:
 *    - Go to Firebase Console > Project Settings > Service Accounts.
 *    - Click "Generate new private key".
 *    - Save the downloaded JSON file as "service-account.json" in this folder.
 *    - WARNING: Never commit "service-account.json" to Git/Version Control.
 * 
 * RUNNING THE SCRIPT:
 *    $ node setAdmin.js
 * 
 * VERIFICATION:
 *    - After the script says "Success", go to your Frontend.
 *    - Sign out and Sign in again to refresh the ID Token.
 *    - The app should now route you to /admin/dashboard.
 * ============================================================================
 */

const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize Firebase Admin
// We use a try/catch to give a clear error if the key is missing
try {
  const serviceAccount = require('./service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('ERROR: Could not find "service-account.json".');
  console.error('Please download your Service Account Key from Firebase Console and save it in this folder.');
  process.exit(1);
}

// 2. Configuration
const TARGET_UID = 'J7BIQNQMjKTz9mjeoxWsLRghcBB3';
const CUSTOM_CLAIMS = { 
  admin: true 
};

// 3. Execution Function
const assignAdminRole = async () => {
  console.log(`Attempting to assign admin role to UID: ${TARGET_UID}...`);

  try {
    // Check if user exists first
    const user = await admin.auth().getUser(TARGET_UID);
    console.log(`User found: ${user.email} (${user.displayName})`);

    // Assign the claim
    await admin.auth().setCustomUserClaims(TARGET_UID, CUSTOM_CLAIMS);
    
    console.log('--------------------------------------------------');
    console.log('SUCCESS! Admin claim assigned.');
    console.log('--------------------------------------------------');
    console.log('IMPORTANT: The user must log out and log back in (or refresh token) on the frontend for this to take effect.');
    
    // Optional: Verify the claim was set
    const updatedUser = await admin.auth().getUser(TARGET_UID);
    console.log('Verification check - Current Claims:', updatedUser.customClaims);

  } catch (error) {
    console.error('FAILED to assign role:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('Double check the UID provided.');
    }
  } finally {
    process.exit();
  }
};

// Run the function
assignAdminRole();

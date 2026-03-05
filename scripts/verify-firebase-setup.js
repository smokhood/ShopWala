#!/usr/bin/env node

/**
 * Firebase Auth Setup Verification Script
 * Run: node scripts/verify-firebase-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Firebase Auth Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Check 1: .env file exists and has Firebase config
console.log('✓ Checking .env file...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];
  
  const missingVars = requiredVars.filter(v => !envContent.includes(v));
  if (missingVars.length === 0) {
    success.push('✅ .env file has all required Firebase variables');
  } else {
    errors.push(`❌ .env missing variables: ${missingVars.join(', ')}`);
  }
} else {
  errors.push('❌ .env file not found!');
}

// Check 2: firebase.ts exists
console.log('✓ Checking firebase.ts...');
const firebasePath = path.join(__dirname, '..', 'src', 'services', 'firebase.ts');
if (fs.existsSync(firebasePath)) {
  const content = fs.readFileSync(firebasePath, 'utf8');
  if (content.includes('getAuth') && content.includes('initializeApp')) {
    success.push('✅ firebase.ts is properly configured');
  } else {
    errors.push('❌ firebase.ts missing auth initialization');
  }
} else {
  errors.push('❌ firebase.ts not found!');
}

// Check 3: useAuthViewModel exists
console.log('✓ Checking useAuthViewModel.ts...');
const authVMPath = path.join(__dirname, '..', 'src', 'viewModels', 'useAuthViewModel.ts');
if (fs.existsSync(authVMPath)) {
  const content = fs.readFileSync(authVMPath, 'utf8');
  if (content.includes('signInWithPhoneNumber') && content.includes('verifyOTP')) {
    success.push('✅ useAuthViewModel.ts has phone auth logic');
  } else {
    warnings.push('⚠️  useAuthViewModel.ts might be missing phone auth functions');
  }
} else {
  errors.push('❌ useAuthViewModel.ts not found!');
}

// Check 4: firestore.rules exists
console.log('✓ Checking firestore.rules...');
const rulesPath = path.join(__dirname, '..', 'firestore.rules');
if (fs.existsSync(rulesPath)) {
  const content = fs.readFileSync(rulesPath, 'utf8');
  if (content.includes('isAuthenticated') && content.includes('users')) {
    success.push('✅ firestore.rules has proper auth rules');
  } else {
    warnings.push('⚠️  firestore.rules might need authentication rules');
  }
} else {
  warnings.push('⚠️  firestore.rules not found (optional for local dev)');
}

// Check 5: package.json has required dependencies
console.log('✓ Checking dependencies...');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['firebase', 'zustand', '@tanstack/react-query'];
  const missingDeps = requiredDeps.filter(d => 
    !pkg.dependencies?.[d] && !pkg.devDependencies?.[d]
  );
  
  if (missingDeps.length === 0) {
    success.push('✅ All required dependencies installed');
  } else {
    errors.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  }
} else {
  errors.push('❌ package.json not found!');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS\n');

if (success.length > 0) {
  console.log('✅ SUCCESS:\n');
  success.forEach(s => console.log('  ' + s));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(w => console.log('  ' + w));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(e => console.log('  ' + e));
  console.log('');
}

console.log('='.repeat(60) + '\n');

// Final summary
if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 Perfect! Your Firebase setup is complete!\n');
  console.log('Next steps:');
  console.log('  1. Enable Phone Auth in Firebase Console');
  console.log('  2. Add test phone numbers');
  console.log('  3. Deploy Firestore rules: firebase deploy --only firestore:rules');
  console.log('  4. Run: npx expo start --clear\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('✅ Setup looks good! Some optional warnings above.\n');
  console.log('You can proceed with testing.\n');
  process.exit(0);
} else {
  console.log('⚠️  Please fix the errors above before proceeding.\n');
  process.exit(1);
}

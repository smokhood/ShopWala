# Firebase Phone Authentication Setup Guide 🔥

Complete step-by-step guide to set up Firebase Phone Authentication for DukandaR.

---

## ✅ Part 1: Firebase Console Setup

### Step 1: Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dukandarapp-56878**
3. Navigate to **Authentication** in left sidebar
4. Click on **Sign-in method** tab
5. Click **Add new provider** → Select **Phone**
6. Toggle **Enable** to ON
7. Click **Save**

### Step 2: Add Test Phone Numbers (for Development)

While developing, use test phone numbers to avoid SMS costs:

1. In Firebase Console > **Authentication** > **Sign-in method**
2. Scroll to **Phone numbers for testing** section
3. Click **Add phone number**
4. Add test numbers (format: +92XXXXXXXXXX):
   ```
   +923001234567 → OTP: 123456
   +923007654321 → OTP: 654321
   +923009999999 → OTP: 111111
   ```
5. Click **Add**

**Important**: These test numbers will work without sending real SMS in both Expo Go and development builds!

---

## ✅ Part 2: reCAPTCHA Configuration (for Expo Go)

Phone Auth requires reCAPTCHA verification for web/Expo Go:

### Automatic Setup (Recommended)
Firebase automatically configures reCAPTCHA for your domain. No action needed!

### Manual Verification (Optional)
1. Go to Firebase Console > **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Ensure these are listed:
   - `localhost`
   - `dukandarapp-56878.firebaseapp.com`
   - Your custom domain (if any)

---

## ✅ Part 3: Android Setup (for Production Builds)

**Note**: For testing in Expo Go, you can skip this part! The native Android setup is only needed when building production APKs or development builds with `npx expo run:android`.

### Step 1: Download google-services.json

1. Go to Firebase Console > **Project Settings** (⚙️ icon)
2. Scroll to **Your apps** section
3. Click on your Android app or **Add app** if not exists
   - Package name: `com.dukandar.app`
   - App nickname: `DukandaR Android`
4. Click **Download google-services.json**
5. Save file to: `d:\REAC\MyFirstApp\android\app\google-services.json`
6. **Skip this step for Expo Go** - Only add googleServicesFile when building native:
   ```json
   "googleServicesFile": "./android/app/google-services.json",
   ```
7. Run `npx expo prebuild --clean` and then `npx expo run:android` for native builds

### Step 2: Configure SHA-1 Certificate (OPTIONAL - Not needed for Firebase JS SDK)

**⚠️ You can skip this step!** 

Firebase Console shows a SHA-1 warning, but it's only required for:
- Native Firebase SDK (@react-native-firebase) - **You're NOT using this**
- Google Sign-In
- Firebase Dynamic Links
- SafetyNet verification

**Your app uses Firebase JS SDK with reCAPTCHA, so SHA-1 is NOT needed.** You can safely ignore the warning in Firebase Console and test immediately with test phone numbers in Expo Go.

<details>
<summary>Click here if you need SHA-1 (most users don't)</summary>

Get your SHA-1 fingerprint:

**For Development:**
```powershell
# Windows
cd android
./gradlew signingReport
```

**For Release (Play Store):**
- Get SHA-1 from Google Play Console > Release > Setup > App signing

Copy the SHA-1 fingerprint (looks like: `A1:B2:C3:...`) and add it:

1. Firebase Console > **Project Settings**
2. Scroll to your Android app
3. Click **Add fingerprint**
4. Paste SHA-1 and click **Save**

</details>

### Step 3: Verify Configuration

✅ **Already configured in your project:**

File: `android/build.gradle` has:
```gradle
classpath('com.google.gms:google-services:4.4.4')
```

File: `android/app/build.gradle` has:
```gradle
apply plugin: 'com.google.gms.google-services'
```

✅ **Auth persistence configured in `src/services/firebase.ts`:**
```typescript
import { Auth, browserLocalPersistence, initializeAuth } from 'firebase/auth';

export const auth: Auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
```

This automatically uses AsyncStorage in React Native for auth state persistence.

---

## ✅ Part 4: iOS Setup (for Production Builds)

### Step 1: Download GoogleService-Info.plist

1. Go to Firebase Console > **Project Settings**
2. Click on your iOS app or **Add app**
   - Bundle ID: `com.dukandar.app`
   - App nickname: `DukandaR iOS`
3. Click **Download GoogleService-Info.plist**
4. Save to: `d:\REAC\MyFirstApp\ios\DukandaR\GoogleService-Info.plist`

### Step 2: Enable Push Notifications (Required for Phone Auth)

1. Apple Developer Console > **Certificates, Identifiers & Profiles**
2. Select your App ID (com.dukandar.app)
3. Enable **Push Notifications**
4. Upload APNs Auth Key to Firebase:
   - Firebase Console > **Project Settings** > **Cloud Messaging** tab
   - Upload APNs Authentication Key

---

## ✅ Part 5: Firestore Security Rules

Your rules are already configured! They're in `firestore.rules`. To deploy:

### Deploy Rules to Firebase
```powershell
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

Or deploy manually:
1. Firebase Console > **Firestore Database**
2. Click **Rules** tab
3. Copy content from `firestore.rules`
4. Click **Publish**

---

## ✅ Part 6: Test Authentication

### Test in Expo Go (Development)

**IMPORTANT**: In Expo Go, you MUST use test phone numbers configured in Firebase Console. Real phone numbers will fail with auth/argument-error.

1. First, add test numbers in Firebase Console (Part 1, Step 2):
   ```
   +923001234567 → OTP: 123456
   +923007654321 → OTP: 654321
   ```

2. Start Expo:
   ```powershell
   npx expo start --clear
   ```

3. Scan QR code in Expo Go app

4. Test flow:
   - Enter **TEST** phone number: +923001234567
   - Wait for reCAPTCHA verification (automatic)
   - Enter test OTP: 123456
   - Should see role selection screen

**Why test numbers only?** Expo Go uses Firebase JS SDK which requires reCAPTCHA for real numbers. Test numbers bypass reCAPTCHA.

### Test with Real Phone Numbers

**Important**: Only works in development builds or production builds, NOT in Expo Go!

1. Create development build:
   ```powershell
   npx expo run:android
   # or
   npx expo run:ios
   ```

2. Use real Pakistani phone number (03XX-XXXXXXX)
3. Receive real SMS with OTP
4. Complete authentication

---

## ✅ Part 7: Environment Variables Check

Verify your `.env` file has correct values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyCGvcc8fDqXFTKi7I1nYRxRVOY8Nl-nI_Q
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=dukandarapp-56878.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=dukandarapp-56878
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=dukandarapp-56878.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=222345434001
EXPO_PUBLIC_FIREBASE_APP_ID=1:222345434001:web:2a9acdad6267fa362b0030
```

These are loaded in `src/services/firebase.ts`.

---

## ✅ Part 8: Common Issues & Solutions

### Issue 1: "auth/argument-error" in Expo Go
**Problem**: Trying to use real phone numbers in Expo Go  
**Solution**: 
- **In Expo Go**: ONLY use test phone numbers from Firebase Console
- Add test numbers: Firebase Console → Authentication → Sign-in method → Phone numbers for testing
- Example: +923001234567 → OTP: 123456
- **For real numbers**: Create development build with `npx expo run:android`

### Issue 2: "Could not parse Expo config: android.googleServicesFile"
**Solution**:
- Remove `googleServicesFile` from app.json when testing in Expo Go
- Only add it when building native: `npx expo run:android`
- The file should be at: `android/app/google-services.json`

### Issue 3: AsyncStorage persistence warning
**This is expected in Expo Go and can be ignored**  
- Auth still works, but won't persist between app restarts
- For persistent auth, create development build
- Warning doesn't affect core functionality

### Issue 4: "reCAPTCHA verification failed"
**Solution**: 
- Use test phone numbers in Expo Go
- For real numbers, create development build
- Check authorized domains in Firebase Console

### Issue 2: "This operation is not supported in this environment"
**Solution**:
- Phone Auth doesn't work in Expo Go with real numbers
- Use test phone numbers OR create development build

### Issue 3: "Network request failed"
**Solution**:
- Check internet connection
- Verify Firebase config in `.env`
- Check if Phone Auth is enabled in Firebase Console

### Issue 5: SMS not received (Production)
**Solution**:
- Check Firebase quota (free tier: 10 SMS/day)
- Verify Phone Auth is enabled in Firebase Console
- Upgrade to Blaze plan for unlimited SMS
- Check internet connection

### Issue 6: "Invalid phone number"
**Solution**:
- Use international format: +92XXXXXXXXXX
- Ensure Phone Auth provider is enabled
- Check Firestore rules allow user creation

---

## ✅ Part 9: Firebase Billing (Important!)

### Free Tier (Spark Plan)
- ❌ Phone Auth: 10 verifications/day (very limited!)
- ✅ Firestore: 50K reads, 20K writes/day
- ✅ Storage: 5GB

### Paid Tier (Blaze Plan) - **Recommended for Production**
- ✅ Phone Auth: Unlimited (pay per SMS)
- ✅ Firestore: Pay as you go
- ✅ Storage: Pay as you go

**Upgrade to Blaze:**
1. Firebase Console > **Spark** (top left)
2. Click **Upgrade**
3. Add payment method
4. Set budget alerts (optional but recommended)

**SMS Pricing in Pakistan:**
- India/Pakistan: ~$0.011 per SMS
- USA: ~$0.035 per SMS

---

## ✅ Part 10: Production Checklist

Before going live, ensure:

- [ ] Phone Auth enabled in Firebase Console
- [ ] Test phone numbers added for QA testing
- [ ] Firestore security rules deployed
- [ ] Upgraded to Blaze plan (for real SMS)
- [ ] SHA-1/SHA-256 fingerprints added (optional, only if using native SDK)
- [ ] APNs key uploaded (iOS, only for native builds)
- [ ] google-services.json added to Android
- [ ] GoogleService-Info.plist added to iOS
- [ ] App builds successfully with native credentials
- [ ] Tested phone auth with real number
- [ ] Firebase billing alerts configured

---

## 📱 Quick Test Commands

### Test in Expo Go
```powershell
npx expo start --clear
# Use test phone: +923001234567, OTP: 123456
```

### Build Android Development
```powershell
npx expo run:android
# Use real phone number, receive SMS
```

### Build iOS Development
```powershell
npx expo run:ios
# Use real phone number, receive SMS
```

### Deploy Firestore Rules
```powershell
firebase deploy --only firestore:rules
```

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/android/phone-auth)
- [Expo Firebase Setup](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/)

---

## ✅ Current Status

Your Firebase setup:
- ✅ Firebase initialized in `src/services/firebase.ts`
- ✅ Auth persistence configured with `browserLocalPersistence`
- ✅ Phone Auth implemented in `src/viewModels/useAuthViewModel.ts`
- ✅ Firestore rules configured in `firestore.rules`
- ✅ Environment variables in `.env`
- ✅ Android Gradle plugins configured
- ✅ google-services.json placed at `android/app/google-services.json`
- ⚠️ **AsyncStorage warning is expected in Expo Go (auth still works)**
- ⏳ **CRITICAL: Enable Phone Auth in Firebase Console (Part 1, Step 1)**
- ⏳ **CRITICAL: Add test phone numbers in Firebase Console (Part 1, Step 2)**
- ⏳ **Deploy Firestore rules (Part 5)**

---

**Next Steps for Expo Go Testing:**
1. Go to [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/dukandarapp-56878/authentication/providers)
2. Enable Phone Authentication
3. Add test phone: +923001234567 → OTP: 123456
4. Restart Expo: `npx expo start --clear`
5. **Use ONLY test phone numbers** (real numbers don't work in Expo Go)

**For Real Phone Numbers:**
Create a development build: `npx expo run:android`

Good luck! 🚀

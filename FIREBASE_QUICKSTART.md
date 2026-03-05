# Firebase Auth Setup - Quick Start ⚡

## 🚀 Immediate Next Steps (5 minutes)

### Option A: Test in Expo Go (Quickest)

**1. Enable Phone Auth in Firebase Console**
```
1. Go to: https://console.firebase.google.com/project/dukandarapp-56878/authentication/providers
2. Click "Phone" → Enable → Save
```

**2. Add Test Phone Numbers**
```
1. Same page, scroll to "Phone numbers for testing"
2. Add: +923001234567 → OTP: 123456
3. Add: +923009876543 → OTP: 654321
3. Click "Add"
```

**3. Deploy Firestore Rules**
```powershell
# Install Firebase CLI (first time only)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (first time only)
firebase init firestore
# Select: Use existing project → dukandarapp-56878
# Firestore rules: firestore.rules
# Firestore indexes: firestore.indexes.json

# Deploy rules
firebase deploy --only firestore:rules
```

**4. Test the App**
```powershell
# Start Expo with clean cache
npx expo start --clear

# In Expo Go app:
1. Enter phone: +923001234567
2. Click "Send OTP"
3. Enter OTP: 123456
4. Select role (Customer/Owner)
5. ✅ Success!
```

---

## 🔍 Verify Firebase Console Setup

### Checklist ✅

Go to [Firebase Console](https://console.firebase.google.com/project/dukandarapp-56878):

#### Authentication Tab
- [ ] **Sign-in method** → Phone is **Enabled** (green toggle)
- [ ] **Phone numbers for testing** has at least 2 test numbers added
- [ ] **Authorized domains** includes:
  - localhost
  - dukandarapp-56878.firebaseapp.com

#### Firestore Database Tab  
- [ ] **Rules** tab shows your custom rules (not default test mode)
- [ ] Rules include: `function isAuthenticated()` and user permissions
- [ ] Last deployed date is recent

#### Project Settings
- [ ] **General** tab shows correct package names:
  - Android: `com.dukandar.app`
  - iOS: `com.dukandar.app`
- [ ] Firebase config matches your `.env` file

---

## 🧪 Testing Scenarios

### Test 1: Mock Authentication (Expo Go)
```
Phone: +923001234567
OTP: 123456
Expected: Login successful → Role selection
```

### Test 2: Invalid OTP
```
Phone: +923001234567
OTP: 999999
Expected: Error "OTP غلط ہے"
```

### Test 3: Invalid Phone Format
```
Phone: 12345
Expected: Error "Valid Pakistani number daalen"
```

### Test 4: Firebase User Creation
After successful login, check Firestore:
```
1. Firebase Console → Firestore Database
2. Check "users" collection
3. Should see new document with your phone number
4. Document should have: id, phone, role, createdAt, etc.
```

### Test 5: Authentication Persistence
```
1. Login successfully
2. Close app completely
3. Reopen app
4. Expected: App should remember you (skip login)
```

---

## 🐛 Quick Troubleshooting

### Error: "This operation is not supported in this environment"
**Fix**: Use test phone numbers in Expo Go. Real phone auth needs development build.
```powershell
# Use test numbers
Phone: +923001234567
OTP: 123456
```

### Error: "reCAPTCHA verification failed"
**Fix**: 
1. Check Firebase Console → Authentication → Phone is enabled
2. Check authorized domains include localhost
3. Clear Expo cache: `npx expo start --clear`

### Error: "Network request failed"
**Fix**:
1. Check internet connection
2. Verify `.env` has correct Firebase config
3. Check Firebase Console → Project Settings → Config matches

### Error: "Invalid Firebase app options"
**Fix**:
```powershell
# Verify .env file exists and has all variables
cat .env

# Restart Expo
npx expo start --clear
```

### App crashes on start
**Fix**:
```powershell
# Clear all caches
npx expo start --clear

# If still crashes, rebuild
npm install
npx expo prebuild --clean
```

---

## 📝 Verification Script

Run this to verify your setup:

```powershell
# Check Firebase CLI installed
firebase --version

# Check if logged in
firebase projects:list

# Check current project
firebase use

# Should show: dukandarapp-56878
```

---

## 🎯 Success Criteria

You'll know auth is working when:

1. ✅ Can enter test phone number in app
2. ✅ Receive OTP (or use test OTP 123456)
3. ✅ OTP verification succeeds
4. ✅ See role selection screen
5. ✅ User document created in Firestore
6. ✅ App remembers login after restart

---

## 📞 Support

**Current Status Check:**
- Project ID: `dukandarapp-56878`
- Auth Method: Phone (SMS)
- Environment: Expo Go (development)
- Test Mode: Yes (using test phone numbers)

**If you see errors**, send me:
1. The exact error message
2. Screenshot of Firebase Console → Authentication → Sign-in method
3. Output of: `firebase projects:list`

---

## 🚀 Production Setup (Later)

When ready to deploy:

1. **Upgrade Firebase Plan**
   - Go to Firebase Console → Spark (top left) → Upgrade
   - Choose Blaze (pay-as-you-go)
   - Set budget alerts

2. **Add Native Config Files**
   - Android: Download `google-services.json`
   - iOS: Download `GoogleService-Info.plist`

3. **Add SHA-1 Fingerprint (Android)**
   ```powershell
   cd android
   ./gradlew signingReport
   ```

4. **Build Native Apps**
   ```powershell
   npx expo run:android
   npx expo run:ios
   ```

---

**Ready to test?** Run `npx expo start --clear` and use test phone +923001234567 with OTP 123456! 🎉

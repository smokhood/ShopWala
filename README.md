# ShopWala - Hyperlocal Commerce Platform

A cross-platform React Native marketplace app connecting local shop owners with nearby customers through GPS-based discovery, real-time ordering, and seamless communication.

![ShopWala](https://img.shields.io/badge/React%20Native-Expo-blue?style=for-the-badge&logo=react) ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 🎯 Overview

ShopWala is a two-sided marketplace for hyperlocal commerce. Customers discover nearby shops and products using GPS, while shop owners manage catalogs, process orders, and run promotions—all in one app.

### Use Cases
- **For Customers**: Find nearby shops, search products, place orders via WhatsApp, save favorites, rate shops
- **For Shop Owners**: Register shop, manage inventory, create deals, track orders, view analytics

---

## ✨ Key Features

### Customer Features
- 🗺️ **Location-based Discovery**: Find shops and products near you using GPS
- 🔍 **Smart Search**: Full-text product search with sorting (nearest, cheapest, best-rated)
- ❤️ **Favorites**: Save and manage favorite shops
- 📦 **Order Management**: Create orders, track status, mark as received
- 💬 **WhatsApp Integration**: One-tap ordering with pre-filled order details
- ⭐ **Ratings & Reviews**: Rate shops after purchase
- 🔔 **Notifications**: Real-time order updates and deals alerts
- 🌐 **Bilingual Support**: English and Urdu interfaces

### Owner Features
- 🏪 **Shop Registration**: Easy onboarding with location setup
- 📦 **Catalog Management**: Add/edit products, control stock status
- 🏷️ **Deal Creation**: Create time-bound promotions with auto-calculated discounts
- 📊 **Order Dashboard**: View pending/completed orders with real-time updates
- 📈 **Analytics**: Track total orders, revenue, ratings
- 🎯 **Demand Alerts**: Identify trending products

### Technical Features
- 🔐 **OTP Authentication**: Firebase Phone Auth with bilingual SMS
- 🔑 **Biometric Login**: Fingerprint/Face ID support
- 📡 **Real-time Sync**: Firestore real-time listeners for orders and inventory
- 🚀 **Offline Support**: SQLite + AsyncStorage for seamless offline experience
- 🔔 **Push Notifications**: Expo Push API integrated with Cloud Functions
- ⚡ **Performance**: Paginated lists with infinite scroll (FlatList + React Query)
- 🌐 **Multi-language**: i18n with runtime language switching

---

## 🛠️ Tech Stack

### Frontend
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (54.0) - Development platform with pre-built modules
- **TypeScript** (5.9) - Type-safe development
- **Navigation**: Expo Router (file-based routing)

### State Management & Data
- **Zustand** - Lightweight state management
- **TanStack React Query** (5.90) - Server state & caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend & Cloud
- **Firebase Authentication** - OTP phone auth
- **Firestore** - Real-time NoSQL database
- **Firebase Cloud Functions** - Serverless backend logic
- **Firebase Storage** - Image storage (if needed)

### UI & Styling
- **NativeWind** (4.2) - Tailwind CSS for React Native
- **Tailwind CSS** (3.4) - Utility-first styling
- **React Native Reanimated** - Smooth animations
- **Expo Icons** - Vector icons

### Features & Services
- **Expo Location** - GPS, reverse geocoding
- **React Native Maps** - Map display
- **Expo Notifications** - Push notifications
- **Expo Secure Store** - Encrypted credentials
- **Expo SQLite** - Offline local database
- **AsyncStorage** - Simple key-value caching
- **i18next** - Internationalization

### Build & Deployment
- **EAS (Expo Application Services)** - Build and deployment
- **Gradle** - Android build system
- **Metro** - JavaScript bundler

---

## 📁 Project Structure

```
MyFirstApp/
├── app/                           # Expo Router file-based app structure
│   ├── (auth)/                    # Auth flow screens
│   │   ├── otp.tsx               # OTP verification
│   │   └── role-select.tsx        # Customer vs Owner selection
│   ├── (customer)/                # Customer app flow
│   │   ├── index.tsx             # Shop discovery
│   │   ├── results.tsx           # Search results
│   │   ├── order.tsx             # Order checkout
│   │   ├── my-orders.tsx         # Order history
│   │   ├── favourites.tsx        # Saved shops
│   │   └── notifications.tsx     # Notification inbox
│   ├── (owner)/                   # Owner app flow
│   │   ├── dashboard.tsx         # Overview & stats
│   │   ├── manage-catalog.tsx    # Edit products
│   │   ├── add-product.tsx       # Add single product
│   │   ├── add-deal.tsx          # Create deals
│   │   └── orders.tsx            # Owner's orders
│   └── _layout.tsx               # Root layout
│
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── SearchBar.tsx
│   │   ├── ShopCard.tsx
│   │   ├── ProductItem.tsx
│   │   ├── OrderItem.tsx
│   │   ├── RatingSheet.tsx
│   │   ├── LocationMapModal.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── ...
│   │
│   ├── services/                  # API & business logic
│   │   ├── firebase.ts           # Firebase config
│   │   ├── authService.ts
│   │   ├── orderService.ts       # Order CRUD
│   │   ├── shopService.ts        # Shop queries
│   │   ├── productService.ts     # Product search
│   │   ├── locationService.ts    # GPS & geocoding
│   │   ├── notificationService.ts
│   │   ├── offlineService.ts     # SQLite & caching
│   │   └── whatsappService.ts    # WhatsApp deep linking
│   │
│   ├── viewModels/                # Business logic & state
│   │   ├── useAuthViewModel.ts
│   │   ├── useOrderViewModel.ts
│   │   ├── useSearchViewModel.ts
│   │   ├── useOwnerDashViewModel.ts
│   │   ├── useFavouritesViewModel.ts
│   │   └── ...
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useLanguage.ts        # i18n switching
│   │   ├── usePaginatedShops.ts  # Infinite scroll
│   │   ├── usePaginatedSearchResults.ts
│   │   └── useErrorHandler.ts
│   │
│   ├── models/                    # TypeScript interfaces
│   │   ├── User.ts
│   │   ├── Shop.ts
│   │   ├── Order.ts
│   │   ├── Product.ts
│   │   └── Notification.ts
│   │
│   ├── store/                     # Zustand stores
│   │   ├── authStore.ts
│   │   ├── locationStore.ts
│   │   └── languageStore.ts
│   │
│   ├── i18n/                      # Translations
│   │   ├── en.ts                 # English
│   │   ├── ur.ts                 # Urdu
│   │   └── index.ts              # i18next setup
│   │
│   ├── utils/                     # Helper functions
│   │   ├── formatters.ts         # Price, phone formatting
│   │   ├── validators.ts         # Zod schemas
│   │   └── deepLinks.ts          # Deep linking
│   │
│   └── constants/                 # App constants
│       ├── categories.ts
│       └── colors.ts
│
├── functions/                     # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts              # Push notification triggers
│   └── package.json              # Node.js runtime config
│
├── android/                       # Android native configuration
├── assets/                        # Images, fonts
├── app.json                       # Expo config
├── firebase.json                  # Firebase config
├── tailwind.config.js             # Tailwind styling
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies

```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (for development)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Firebase Project** (create at [firebase.google.com](https://firebase.google.com))
- **EAS Account** (optional, for building: [expo.dev](https://expo.dev))

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/shopwala.git
   cd shopwala
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Setup Firebase**
   - Create a Firebase project in Firebase Console
   - Enable Phone Authentication (SMS)
   - Enable Firestore Database (test mode for development)
   - Enable Cloud Functions
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Update `src/services/firebase.ts` with your config

4. **Setup Environment Variables**
   - Copy `.env.example` to `.env.local` (if provided)
   - Add Firebase credentials and Expo config

5. **Run the app**
   ```bash
   # Start development server
   npm run start
   # or
   expo start

   # Run on Android
   npm run android
   # or
   expo run:android

   # Run on iOS
   npm run ios
   # or
   expo run:ios

   # Run in web (preview only)
   npm run web
   ```

---

## 📚 Usage

### For Customers
1. **Sign In**: Enter phone number → Verify OTP → Select "Customer" role
2. **Discover**: View nearby shops on home screen, sorted by distance
3. **Search**: Search for products → Filter by price/rating → View results
4. **Order**: Add items to cart → Submit order via WhatsApp
5. **Track**: View order status in "My Orders"
6. **Rate**: Leave a star rating and feedback after order completion

### For Shop Owners
1. **Register**: Sign In → Select "Shop Owner" → Register shop details & location
2. **Catalog**: Add products → Set prices & stock levels
3. **Deals**: Create limited-time deals with automatic discount calculation
4. **Orders**: View incoming customer orders → Mark as "Dispatched"
5. **Analytics**: Track total orders, revenue, average rating on dashboard

---

## 🔐 Authentication & Security

- **OTP Phone Auth**: Firebase Phone Authentication (SMS-based)
- **Biometric Support**: Fingerprint/Face ID fallback login
- **Secure Storage**: Expo Secure Store for auth tokens
- **Role-based Access**: Strict rules for customer vs owner operations

---

## 📡 Data Sync & Offline Support

- **Real-time Updates**: Firestore listeners for orders, inventory changes
- **Offline Caching**: SQLite for cached shops/products + AsyncStorage for user preferences
- **Conflict Resolution**: Pending action queue syncs when back online
- **Network Detection**: NetInfo monitors connectivity state in real-time

---

## 🌐 Localization

Supports **English** and **Urdu** with runtime language switching:
- Translation files: `src/i18n/en.ts` and `src/i18n/ur.ts`
- Device locale auto-detection
- Dynamic text rendering in RTL for Urdu

---

## 📦 Build & Deployment

### Local Build (Android)
```bash
npm run android
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to app stores
eas submit
```

### Firebase Cloud Functions Deploy
```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 📊 Performance Optimizations

- **Pagination**: Infinite scroll for shops & search results (avoids loading all data at once)
- **Caching**: React Query + SQLite for smart data reuse
- **Lazy Loading**: Components and services loaded on-demand
- **Image Optimization**: Expo Image with responsive sizing
- **Animation Performance**: React Native Reanimated for 60fps animations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit changes**: `git commit -m "Add your feature"`
4. **Push to branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request**

### Code Standards
- Use **TypeScript** for all new code
- Follow **ESLint** rules (run `npm run lint`)
- Write meaningful commit messages
- Test feature locally before submitting PR

---

## 🐛 Known Issues & Limitations

- Push notifications require development build (not available in Expo Go on Android)
- Phone authentication requires real app or Firebase Emulator setup
- Maps require valid location permissions on device

---

---

## 👨‍💻 Author

**Ahtisham Tasawar**
- GitHub: [smokhood](https://github.com/smokhood)
- Email: ahtishamravian206@gmail.com

---

## 📞 Support

For issues and questions:
- Open an [GitHub Issue](https://github.com/smokhood/shopwala/issues)
- Check [existing issues](https://github.com/smokhood/shopwala/issues) first
- Contact via email

---


**Last Updated**: March 2026  
**Version**: 1.0.0

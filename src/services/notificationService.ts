// Notification Service for DukandaR
import { Deal } from '@models/Deal';
import { NotificationType } from '@models/Notification';
import Constants from 'expo-constants';
import type { Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Lazy load notifications only when needed to avoid Expo Go issues
let NotificationsModule: typeof import('expo-notifications') | null = null;
let notificationHandlerSetup = false;
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

interface PushDataPayload {
  [key: string]: string | number | boolean | null;
}

interface NotifyUserInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string | null;
  shopId?: string | null;
  productName?: string | null;
  pushData?: PushDataPayload;
}

interface NotificationNavigationData {
  actionUrl?: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: PushDataPayload;
  sound?: 'default';
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

async function getNotificationsModule() {
  if (NotificationsModule === null) {
    try {
      NotificationsModule = await import('expo-notifications');
    } catch (error) {
      console.warn('Failed to load notifications module:', (error as Error).message);
      return null;
    }
  }
  return NotificationsModule;
}

// Setup notification handler (call this when actually using notifications)
async function setupNotificationHandler() {
  if (notificationHandlerSetup) return;
  
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    // Skip notification setup in Expo Go on Android
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    
    notificationHandlerSetup = true;
  } catch (error) {
    console.warn('Notification configuration warning:', (error as Error).message);
  }
}

/**
 * Request notification permission
 * @returns True if granted (false in Expo Go for Android)
 */
export async function requestPermission(): Promise<boolean> {
  try {
    // Skip on Android in Expo Go as push notifications are not available
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
      return false;
    }

    // Setup handler when actually requesting permissions
    await setupNotificationHandler();

    const Notifications = await getNotificationsModule();
    if (!Notifications) return false;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
        });
      } catch (error) {
        console.warn('Notification channel setup warning:', (error as Error).message);
      }
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Request notification permission warning:', (error as Error).message);
    return false;
  }
}

/**
 * Register tap handler for push/local notification interactions.
 * Returns cleanup function for listener removal.
 */
export async function registerNotificationResponseHandler(
  onNavigate: (path: string) => void
): Promise<(() => void) | null> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationNavigationData | undefined;
        const actionUrl = data?.actionUrl;
        if (actionUrl && typeof actionUrl === 'string') {
          onNavigate(actionUrl);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  } catch (error) {
    console.warn('Register notification response handler warning:', (error as Error).message);
    return null;
  }
}

/**
 * Get Expo push token (for production)
 * @returns Push token or null
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Push notifications don't work in Expo Go
    if (!Constants.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Skip on Android in Expo Go as it's not supported
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
      console.log('Push notifications not available in Expo Go on Android');
      return null;
    }

    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('No project ID found');
      return null;
    }

    try {
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      return token;
    } catch (tokenError) {
      console.warn('Could not get push token (may not be supported in current environment):', (tokenError as Error).message);
      return null;
    }
  } catch (error) {
    console.warn('Get Expo push token warning:', (error as Error).message);
    return null;
  }
}

/**
 * Register and persist Expo push token for a user.
 * Safe to call repeatedly (uses arrayUnion for dedupe on token list).
 */
export async function registerPushTokenForUser(
  userId: string
): Promise<string | null> {
  try {
    if (!userId) return null;

    const granted = await requestPermission();
    if (!granted) return null;

    const token = await getExpoPushToken();
    if (!token) return null;

    const { doc, setDoc, arrayUnion, serverTimestamp } = await import(
      'firebase/firestore'
    );
    const { db } = await import('@services/firebase');

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      expoPushToken: token,
      expoPushTokens: arrayUnion(token),
      pushEnabled: true,
      pushTokenUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return token;
  } catch (error) {
    console.warn(
      'Register push token warning:',
      (error as Error).message
    );
    return null;
  }
}

/**
 * Write notification document into Firestore notification inbox.
 */
export async function createInAppNotification(
  input: NotifyUserInput
): Promise<void> {
  try {
    const { addDoc, collection, serverTimestamp } = await import(
      'firebase/firestore'
    );
    const { db } = await import('@services/firebase');

    await addDoc(collection(db, 'notifications'), {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      shopId: input.shopId ?? null,
      productName: input.productName ?? null,
      actionUrl: input.actionUrl ?? null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Create in-app notification error:', error);
  }
}

/**
 * Create notification inbox item and send push to the target user's known devices.
 */
export async function notifyUser(input: NotifyUserInput): Promise<void> {
  try {
    await createInAppNotification(input);

    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@services/firebase');

    const userRef = doc(db, 'users', input.userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data() as {
      expoPushToken?: string | null;
      expoPushTokens?: unknown;
      pushEnabled?: boolean;
    };

    if (userData.pushEnabled === false) return;

    const tokens = extractExpoTokens(userData.expoPushToken, userData.expoPushTokens);
    if (tokens.length === 0) return;

    await sendPushToTokens(tokens, input.title, input.body, input.pushData);
  } catch (error) {
    console.error('Notify user error:', error);
  }
}

/**
 * Send push message to one or more Expo push tokens.
 */
export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: PushDataPayload
): Promise<void> {
  try {
    const uniqueTokens = Array.from(new Set(tokens.filter((token) => token.startsWith('ExponentPushToken['))));
    if (uniqueTokens.length === 0) return;

    const messages: ExpoPushMessage[] = uniqueTokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    }));

    const chunks = chunkArray(messages, 100);
    for (const chunk of chunks) {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn('Expo push send warning:', response.status, text);
      }
    }
  } catch (error) {
    console.error('Send push to tokens error:', error);
  }
}

function extractExpoTokens(
  singleToken?: string | null,
  tokenList?: unknown
): string[] {
  const tokens = new Set<string>();

  if (singleToken && typeof singleToken === 'string') {
    tokens.add(singleToken);
  }

  if (Array.isArray(tokenList)) {
    for (const token of tokenList) {
      if (typeof token === 'string') {
        tokens.add(token);
      }
    }
  }

  return Array.from(tokens);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Schedule a local notification
 * @param title Notification title
 * @param body Notification body
 * @param trigger Seconds from now (null for immediate)
 * @returns Notification identifier
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number | null = null
): Promise<string> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      throw new Error('Notifications module not available');
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds === null 
        ? null 
        : { 
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
          },
    });

    return identifier;
  } catch (error) {
    console.error('Schedule local notification error:', error);
    throw error;
  }
}

/**
 * Schedule deal alert notification
 * @param deal Deal object
 */
export async function scheduleDealAlert(deal: Deal): Promise<void> {
  try {
    await scheduleLocalNotification(
      '🔥 Aaj Ka Deal!',
      `${deal.shopName}: ${deal.productName} sirf Rs. ${deal.dealPrice}`,
      null // Immediate
    );
  } catch (error) {
    console.error('Schedule deal alert error:', error);
    // Don't throw - notification is not critical
  }
}

/**
 * Schedule stock reminder for shop owner
 * @param productName Product name
 * @param searchCount Number of searches
 */
export async function scheduleStockReminderForOwner(
  productName: string,
  searchCount: number
): Promise<void> {
  try {
    await scheduleLocalNotification(
      '🔍 Customers Dhundh Rahe Hain',
      `${searchCount} log "${productName}" dhundh rahe hain aapke qareeb. Kya aapke paas hai?`,
      null // Immediate
    );
  } catch (error) {
    console.error('Schedule stock reminder error:', error);
    // Don't throw - notification is not critical
  }
}

/**
 * Cancel a scheduled notification
 * @param id Notification identifier
 */
export async function cancelNotification(id: string): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.error('Cancel notification error:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Cancel all notifications error:', error);
  }
}

/**
 * Get user's app notifications from Firestore
 * @param userId User ID
 * @returns Array of app notifications
 */
export async function getNotifications(userId: string): Promise<any[]> {
  try {
    const { collection, query, where, getDocs, orderBy } = await import(
      'firebase/firestore'
    );
    const { db } = await import('@services/firebase');

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * @param userId User ID
 * @param notificationId Notification ID
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const { updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@services/firebase');

    const notifRef = await getOwnedNotificationRef(db, userId, notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Delete notification
 * @param userId User ID
 * @param notificationId Notification ID
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const { db } = await import('@services/firebase');

    const notifRef = await getOwnedNotificationRef(db, userId, notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Resolve a notification reference and verify it belongs to the caller.
 */
async function getOwnedNotificationRef(
  db: Firestore,
  userId: string,
  notificationId: string
) {
  const { doc, getDoc } = await import('firebase/firestore');

  const notifRef = doc(db, 'notifications', notificationId);
  const snapshot = await getDoc(notifRef);

  if (!snapshot.exists()) {
    throw new Error('Notification not found');
  }

  const ownerId = snapshot.data()?.userId;
  if (ownerId !== userId) {
    throw new Error('Unauthorized notification access');
  }

  return notifRef;
}

// Notification Service for DukandaR
import { Deal } from '@models/Deal';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Lazy load notifications only when needed to avoid Expo Go issues
let NotificationsModule: typeof import('expo-notifications') | null = null;
let notificationHandlerSetup = false;

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
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('@services/firebase');

    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: new Date(),
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
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('@services/firebase');

    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// WhatsApp Service for DukandaR
import { Order } from '@models/Order';
import { Shop } from '@models/Shop';
import { formatPrice } from '@utils/formatters';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';
import { buildShopLink } from '../utils/deepLinks';

/**
 * Build WhatsApp message from order
 * @param order Order object
 * @returns Formatted message string
 */
export function buildOrderMessage(order: Order): string {
  let message = 'Assalam o Alaikum! 🛒\n\n';
  message += 'Mera Order (ShopWala se):\n';
  message += '─────────────────────\n';

  order.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    message += `• ${item.productName} x${item.quantity} — ${formatPrice(itemTotal)}\n`;
  });

  message += '─────────────────────\n';
  message += `Total: ${formatPrice(order.subtotal)}\n`;

  if (order.note) {
    message += `\nNote: ${order.note}\n`;
  }

  message += '\n📱 ShopWala App se bheja gaya';

  return message;
}

/**
 * Open WhatsApp with order message
 * @param order Order object
 */
export async function openWhatsAppOrder(order: Order): Promise<void> {
  try {
    const message = buildOrderMessage(order);
    const encodedMessage = encodeURIComponent(message);
    
    // Remove + and spaces from phone number
    const phoneNumber = order.shopWhatsapp.replace(/[+\s]/g, '');

    // Try native WhatsApp URL first
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to web WhatsApp
      const webUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Open WhatsApp error:', error);
    throw error;
  }
}

/**
 * Check if WhatsApp is installed
 * @returns True if WhatsApp is available
 */
export async function isWhatsAppInstalled(): Promise<boolean> {
  try {
    return await Linking.canOpenURL('whatsapp://send');
  } catch (error) {
    console.error('Check WhatsApp installed error:', error);
    return false;
  }
}

/**
 * Share shop link via native sharing
 * @param shop Shop object
 */
export async function shareShopLink(shop: Shop): Promise<void> {
  try {
    const deepLink = buildShopLink(shop.id);
    const message = `Dekho ${shop.name} ShopWala pe!\n\nYahan se unka catalog dekho aur order karo:\n${deepLink}`;

    await Share.share({
      message,
    });
  } catch (error) {
    console.error('Share shop link error:', error);
    throw error;
  }
}

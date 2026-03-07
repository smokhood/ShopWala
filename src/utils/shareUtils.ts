/**
 * Share Shop Utility
 * Generates deep links and shares shop details via WhatsApp or system share
 */

import { Alert, Share } from 'react-native';
import { buildShopLink } from './deepLinks';

interface ShareShopParams {
  shopId: string;
  shopName: string;
  shopPhone?: string;
}

/**
 * Share shop via system share sheet or copy to clipboard
 * Generates deep link and message with shop details
 */
export const shareShop = async ({
  shopId,
  shopName,
  shopPhone,
}: ShareShopParams) => {
  try {
    const deepLink = buildShopLink(shopId);
    const appLink = 'https://play.google.com/store/apps/details?id=com.dukandar';
    
    const message = `*${shopName}* ShopWala pe hai!\n\n📱 آن لائن کیٹلاگ دیکھیں اور واٹس ایپ پر آرڈر کریں:\n${deepLink}\n\n📲 ShopWala ڈاؤن لوڈ کریں:\n${appLink}`;

    await Share.share({
      message: message,
      title: 'دکان شیئر کریں',
    });
  } catch (error) {
    console.error('Error sharing shop:', error);
    Alert.alert('خرابی', 'دکان شیئر کرنے میں خرابی');
  }
};

/**
 * Handle share button tap
 */
export const handleShareShop = async (shop: any) => {
  await shareShop({
    shopId: shop.id,
    shopName: shop.name,
    shopPhone: shop.whatsapp,
  });
};

/**
 * Deep Link Parser - Handle incoming deep links
 * Supports: dukandar://shop/{id}, dukandar://search?q={query}
 */

export type DeepLinkType = 'shop' | 'search' | 'unknown';

export interface DeepLinkResult {
  type: DeepLinkType;
  shopId?: string;
  query?: string;
  path?: string;
}

const SCHEME = 'dukandar://';

/**
 * Build deep link for a shop
 */
export function buildShopLink(shopId: string): string {
  return `${SCHEME}shop/${shopId}`;
}

/**
 * Build deep link for product search
 */
export function buildProductSearchLink(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `${SCHEME}search?q=${encodedQuery}`;
}

/**
 * Parse incoming deep link URL
 * Returns structured result for navigation
 */
export function parseDeepLink(url: string | null): DeepLinkResult {
  if (!url) {
    return { type: 'unknown' };
  }

  try {
    // Remove scheme to get path
    const urlWithoutScheme = url.replace(SCHEME, '');
    
    // Parse shop link: dukandar://shop/{id}
    const shopMatch = urlWithoutScheme.match(/^shop\/([a-zA-Z0-9_-]+)$/);
    if (shopMatch) {
      return {
        type: 'shop',
        shopId: shopMatch[1],
        path: `/(customer)/shop/${shopMatch[1]}`,
      };
    }

    // Parse search link: dukandar://search?q={query}
    const searchMatch = urlWithoutScheme.match(/^search\?q=(.+)$/);
    if (searchMatch) {
      const query = decodeURIComponent(searchMatch[1]);
      return {
        type: 'search',
        query,
        path: `/(customer)/results?q=${encodeURIComponent(query)}`,
      };
    }

    // Unknown link format
    console.warn('[Deep Link] Unknown format:', url);
    return { type: 'unknown' };
  } catch (error) {
    console.error('[Deep Link] Parse error:', error);
    return { type: 'unknown' };
  }
}

/**
 * Check if URL is a valid deep link for this app
 */
export function isAppDeepLink(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith(SCHEME);
}

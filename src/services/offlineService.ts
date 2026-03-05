// Offline Service for DukandaR using expo-sqlite
import { ProductWithShop } from '@models/Product';
import { Shop } from '@models/Shop';
import * as SQLite from 'expo-sqlite';
import { calculateDistance } from './locationService';

const DB_NAME = 'dukandar.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize SQLite database
 */
export function initDB(): void {
  if (db) return; // Already initialized
  
  try {
    db = SQLite.openDatabaseSync(DB_NAME);
    
    if (!db) {
      console.error('Failed to open database');
      return;
    }

    // Create tables if not exist
    db.execSync(`
      CREATE TABLE IF NOT EXISTS cached_shops (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        geohash TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cached_searches (
        query TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recent_searches (
        query TEXT PRIMARY KEY,
        used_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_shops_geohash ON cached_shops(geohash);
      CREATE INDEX IF NOT EXISTS idx_shops_cached_at ON cached_shops(cached_at);
      CREATE INDEX IF NOT EXISTS idx_searches_cached_at ON cached_searches(cached_at);
      CREATE INDEX IF NOT EXISTS idx_recent_searches_used_at ON recent_searches(used_at);
    `);

    console.log('✅ SQLite database initialized');
  } catch (error) {
    console.error('❌ Init DB error:', error);
    db = null;
  }
}

/**
 * Cache shops to local database
 * @param shops Array of shops
 */
export function cacheShops(shops: Shop[]): void {
  if (!db) {
    console.warn('DB not initialized');
    return;
  }

  try {
    const now = Date.now();

    shops.forEach((shop) => {
      db!.runSync(
        `INSERT OR REPLACE INTO cached_shops (id, data, lat, lng, geohash, cached_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          shop.id,
          JSON.stringify(shop),
          shop.location.latitude,
          shop.location.longitude,
          shop.location.geohash,
          now,
        ]
      );
    });
  } catch (error) {
    console.error('Cache shops error:', error);
  }
}

/**
 * Get cached shops nearby
 * @param lat User latitude
 * @param lng User longitude
 * @param radiusKm Search radius
 * @returns Array of shops
 */
export function getCachedShopsNearby(
  lat: number,
  lng: number,
  radiusKm: number
): Shop[] {
  if (!db) {
    console.warn('DB not initialized');
    return [];
  }

  try {
    const rows = db.getAllSync<{ data: string; lat: number; lng: number }>(
      'SELECT data, lat, lng FROM cached_shops'
    );

    const shops: Shop[] = rows
      .map((row) => {
        const shop = JSON.parse(row.data) as Shop;
        const distance = calculateDistance(lat, lng, row.lat, row.lng);
        return { ...shop, distance };
      })
      .filter((shop) => shop.distance <= radiusKm)
      .sort((a, b) => a.distance! - b.distance!);

    return shops;
  } catch (error) {
    console.error('Get cached shops nearby error:', error);
    return [];
  }
}

/**
 * Cache search result
 * @param query Search query
 * @param results Search results
 */
export function cacheSearchResult(
  query: string,
  results: ProductWithShop[]
): void {
  if (!db) return;

  try {
    const now = Date.now();
    db.runSync(
      `INSERT OR REPLACE INTO cached_searches (query, data, cached_at)
       VALUES (?, ?, ?)`,
      [query.toLowerCase(), JSON.stringify(results), now]
    );
  } catch (error) {
    console.error('Cache search result error:', error);
  }
}

/**
 * Get recent search queries from local SQLite cache
 * @param limit Max number of recent queries
 */
export function getRecentSearches(limit: number = 5): string[] {
  if (!db) return [];

  try {
    const rows = db.getAllSync<{ query: string }>(
      'SELECT query FROM recent_searches ORDER BY used_at DESC LIMIT ?',
      [limit]
    );

    return rows.map((row) => row.query);
  } catch (error) {
    console.error('Get recent searches error:', error);
    return [];
  }
}

/**
 * Add or refresh a recent search query and keep only latest N entries
 * @param query Search query
 * @param max Max number of entries to retain
 */
export function upsertRecentSearch(query: string, max: number = 5): void {
  if (!db) return;

  try {
    const now = Date.now();
    const normalized = query.trim();
    if (!normalized) return;

    db.runSync(
      `INSERT INTO recent_searches (query, used_at) VALUES (?, ?)
       ON CONFLICT(query) DO UPDATE SET used_at = excluded.used_at`,
      [normalized, now]
    );

    db.runSync(
      `DELETE FROM recent_searches
       WHERE query NOT IN (
         SELECT query FROM recent_searches ORDER BY used_at DESC LIMIT ?
       )`,
      [max]
    );
  } catch (error) {
    console.error('Upsert recent search error:', error);
  }
}

/**
 * Remove a single recent search query
 * @param query Search query
 */
export function removeRecentSearch(query: string): void {
  if (!db) return;

  try {
    db.runSync('DELETE FROM recent_searches WHERE query = ?', [query]);
  } catch (error) {
    console.error('Remove recent search error:', error);
  }
}

/**
 * Get cached search result
 * @param query Search query
 * @returns Search results or null if not found/expired
 */
export function getCachedSearchResult(query: string): ProductWithShop[] | null {
  if (!db) return null;

  try {
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const cutoff = Date.now() - TWO_HOURS;

    const row = db.getFirstSync<{ data: string; cached_at: number }>(
      'SELECT data, cached_at FROM cached_searches WHERE query = ? AND cached_at > ?',
      [query.toLowerCase(), cutoff]
    );

    if (row) {
      return JSON.parse(row.data);
    }

    return null;
  } catch (error) {
    console.error('Get cached search result error:', error);
    return null;
  }
}

/**
 * Clear old cache (older than 24 hours)
 */
export function clearOldCache(): void {
  if (!db) return;

  try {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - ONE_DAY;

    db.runSync('DELETE FROM cached_shops WHERE cached_at < ?', [cutoff]);
    db.runSync('DELETE FROM cached_searches WHERE cached_at < ?', [cutoff]);

    console.log('Old cache cleared');
  } catch (error) {
    console.error('Clear old cache error:', error);
  }
}

/**
 * Get pending actions (for sync when back online)
 * @returns Array of pending actions
 */
export function getPendingActions(): Array<{
  id: number;
  type: string;
  data: any;
}> {
  if (!db) return [];

  try {
    const rows = db.getAllSync<{ id: number; type: string; data: string }>(
      'SELECT id, type, data FROM pending_actions ORDER BY created_at ASC'
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
    }));
  } catch (error) {
    console.error('Get pending actions error:', error);
    return [];
  }
}

/**
 * Clear completed pending action
 * @param id Action ID
 */
export function clearPendingAction(id: number): void {
  if (!db) return;

  try {
    db.runSync('DELETE FROM pending_actions WHERE id = ?', [id]);
  } catch (error) {
    console.error('Clear pending action error:', error);
  }
}

/**
 * Add pending action (for offline operations)
 * @param type Action type
 * @param data Action data
 */
export function addPendingAction(type: string, data: any): void {
  if (!db) return;

  try {
    db.runSync(
      'INSERT INTO pending_actions (type, data, created_at) VALUES (?, ?, ?)',
      [type, JSON.stringify(data), Date.now()]
    );
  } catch (error) {
    console.error('Add pending action error:', error);
  }
}

// Initialize database on module load
initDB();

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDealCreated = exports.onOrderCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const db = admin.firestore();
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
exports.onOrderCreated = (0, firestore_1.onDocumentCreated)('orders/{orderId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        return;
    }
    const orderId = event.params.orderId;
    const order = snap.data();
    if (!order.shopId || !order.customerId) {
        firebase_functions_1.logger.warn('Order missing required fields', { orderId });
        return;
    }
    try {
        const shopSnap = await db.collection('shops').doc(order.shopId).get();
        const ownerId = shopSnap.exists ? shopSnap.data()?.ownerId : undefined;
        if (ownerId) {
            await notifyUser(ownerId, {
                type: 'stock_request',
                title: 'Naya order mila',
                body: `${Array.isArray(order.items) ? order.items.length : 0} items ka order ${order.shopName || ''} ke liye aya hai.`.trim(),
                actionUrl: '/(owner)/dashboard',
                shopId: order.shopId,
                pushData: {
                    type: 'stock_request',
                    orderId,
                    shopId: order.shopId,
                },
            });
        }
        await notifyUser(order.customerId, {
            type: 'system',
            title: 'Order place ho gaya',
            body: `${order.shopName || 'Shop'} ko aapka order bhej diya gaya hai.`,
            actionUrl: '/(customer)/notifications',
            shopId: order.shopId,
            pushData: {
                type: 'system',
                orderId,
                shopId: order.shopId,
            },
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('onOrderCreated failed', error, { orderId });
    }
});
exports.onDealCreated = (0, firestore_1.onDocumentCreated)('deals/{dealId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        return;
    }
    const dealId = event.params.dealId;
    const deal = snap.data();
    if (!deal.shopId) {
        firebase_functions_1.logger.warn('Deal missing shopId', { dealId });
        return;
    }
    try {
        const followersSnap = await db
            .collection('users')
            .where('savedShops', 'array-contains', deal.shopId)
            .get();
        const noteText = (deal.note || '').trim();
        const body = noteText
            ? `${deal.shopName || 'Aap ki pasandeeda dukaan'}: ${deal.productName || 'Product'} - ${noteText}`
            : `${deal.shopName || 'Aap ki pasandeeda dukaan'}: ${deal.productName || 'Product'} par naya deal available hai.`;
        await Promise.all(followersSnap.docs.map((userDoc) => notifyUser(userDoc.id, {
            type: 'new_deal',
            title: 'Naya deal available',
            body,
            actionUrl: '/(customer)/notifications',
            shopId: deal.shopId || null,
            productName: deal.productName || null,
            pushData: {
                type: 'new_deal',
                dealId,
                shopId: deal.shopId || null,
            },
        })));
    }
    catch (error) {
        firebase_functions_1.logger.error('onDealCreated failed', error, { dealId });
    }
});
async function notifyUser(userId, payload) {
    await db.collection('notifications').add({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        shopId: payload.shopId ?? null,
        productName: payload.productName ?? null,
        actionUrl: payload.actionUrl ?? null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
        return;
    }
    const user = userSnap.data();
    if (user.pushEnabled === false) {
        return;
    }
    const tokens = extractTokens(user);
    if (tokens.length === 0) {
        return;
    }
    const pushData = {
        actionUrl: payload.actionUrl ?? null,
        ...(payload.pushData || {}),
    };
    const invalidTokens = await sendExpoPush(tokens, payload.title, payload.body, pushData);
    if (invalidTokens.length > 0) {
        await db.collection('users').doc(userId).set({
            expoPushTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}
function extractTokens(user) {
    const set = new Set();
    if (typeof user.expoPushToken === 'string') {
        set.add(user.expoPushToken);
    }
    if (Array.isArray(user.expoPushTokens)) {
        for (const token of user.expoPushTokens) {
            if (typeof token === 'string') {
                set.add(token);
            }
        }
    }
    return Array.from(set).filter((token) => token.startsWith('ExponentPushToken['));
}
async function sendExpoPush(tokens, title, body, data) {
    const invalidTokens = [];
    const messages = tokens.map((token) => ({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
    }));
    const chunks = chunk(messages, 100);
    for (const batch of chunks) {
        try {
            const res = await fetch(EXPO_PUSH_ENDPOINT, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batch),
            });
            const json = (await res.json());
            if (Array.isArray(json.data)) {
                json.data.forEach((ticket, index) => {
                    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
                        const token = batch[index]?.to;
                        if (token) {
                            invalidTokens.push(token);
                        }
                    }
                });
            }
        }
        catch (error) {
            firebase_functions_1.logger.warn('Expo push batch failed', error);
        }
    }
    return invalidTokens;
}
function chunk(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) {
        out.push(items.slice(i, i + size));
    }
    return out;
}

import { useEffect } from 'react';
import { get, post } from '../lib/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function usePushNotifications(user) {
  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function setup() {
      try {
        // register the service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // don't ask if already denied - once denied, we respect it
        if (Notification.permission === 'denied') return;

        // fetch public VAPID key from backend
        let vapidKey;
        try {
          const data = await get('/push/vapid-public-key');
          vapidKey = data.key;
        } catch {
          return; // push not configured on this server, skip silently
        }

        const applicationServerKey = urlBase64ToUint8Array(vapidKey);

        // check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // request permission first - only prompt if we haven't asked yet
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });
        }

        // send subscription to backend (upsert, safe to call every time)
        await post('/push/subscribe', {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          }
        });
      } catch (err) {
        // Push setup failing should never break the app — log and move on
        console.debug('[push] setup failed:', err.message);
      }
    }

    setup();
  }, [user?.id]);
}

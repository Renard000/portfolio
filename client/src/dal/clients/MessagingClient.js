/**
 * Notifications push (Firebase Cloud Messaging). Firebase n'est chargé qu'à la demande
 * (import dynamique) pour ne pas alourdir le premier affichage.
 */
export default class MessagingClient {
  constructor(firebaseApp, vapidKey) {
    this.firebaseApp = firebaseApp;
    this.vapidKey = vapidKey;
  }

  async isSupported() {
    if (
      !this.firebaseApp ||
      !('serviceWorker' in navigator) ||
      !('Notification' in window)
    )
      return false;
    const { isSupported } = await import('firebase/messaging');
    return isSupported();
  }

  async requestPermission() {
    return Notification.requestPermission();
  }

  /** Renvoie le jeton FCM, ou null si la permission est refusée ou non supportée. */
  async getToken() {
    if (!(await this.isSupported())) return null;
    if ((await this.requestPermission()) !== 'granted') return null;

    const { getMessaging, getToken } = await import('firebase/messaging');
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );
    return getToken(getMessaging(this.firebaseApp), {
      vapidKey: this.vapidKey,
      serviceWorkerRegistration: registration,
    });
  }
}

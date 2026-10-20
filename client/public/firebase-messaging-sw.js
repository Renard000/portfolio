// Importation des scripts compatibles pour les Service Workers via CDN (compat version)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 1. Configuration Firebase (Option 1 : en dur dans le SW car pas d'import.meta.env ici)
firebase.initializeApp({
  apiKey: "AIzaSyD_FcWSMvgaShq91jnWBOOsF_auBmSqCU0",
  authDomain: "portfolio-6e11b.firebaseapp.com",
  projectId: "portfolio-6e11b",
  storageBucket: "portfolio-6e11b.firebasestorage.app",
  messagingSenderId: "44159864753",
  appId: "1:44159864753:web:688a503be3e60087137790"
});

// 2. Initialisation de la messagerie en arrière-plan
const messaging = firebase.messaging();

// 3. Gestion de la réception d'une notification lorsque l'app est en arrière-plan ou fermée
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico' // Icône affichée avec la notification
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
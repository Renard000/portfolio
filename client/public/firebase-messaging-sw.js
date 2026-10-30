// Importation des scripts compatibles pour les Service Workers via CDN (compat version)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 1. Configuration Firebase (Option 1 : en dur dans le SW car pas d'import.meta.env ici)
firebase.initializeApp({
  apiKey: 'AIzaSyD_FcWSMvgaShq91jnWBOOsF_auBmSqCU0',
  authDomain: 'portfolio-6e11b.firebaseapp.com',
  projectId: 'portfolio-6e11b',
  storageBucket: 'portfolio-6e11b.firebasestorage.app',
  messagingSenderId: '44159864753',
  appId: '1:44159864753:web:688a503be3e60087137790',
});

// 2. Initialisation de la messagerie en arrière-plan.
// Le serveur envoie un bloc `notification` : Firebase l'affiche lui-même et ouvre le lien
// au clic. Appeler showNotification ici afficherait chaque notification en double.
firebase.messaging();

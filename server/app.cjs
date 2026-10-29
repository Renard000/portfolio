// Point d'entrée CommonJS pour l'hébergeur (sélecteur Node.js de RapidNet / Passenger).
// Le projet utilise les modules ES ("type": "module") : certains hébergeurs exigent un
// fichier de démarrage CommonJS qui charge ensuite le vrai point d'entrée.
import('./src/index.js').catch((err) => {
  console.error(err);
  process.exit(1);
});

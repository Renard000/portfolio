/**
 * Textes des pages transverses de la newsletter (maquette P-14). Le serveur redirige
 * les liens des courriels vers /newsletter/confirmation ou /newsletter/desinscription
 * avec ?statut=ok|invalide : aucune donnée personnelle dans l'adresse.
 */
export const newsletterPages = {
  confirm: {
    ok: {
      kicker: 'Newsletter · confirmation',
      symbol: '✓',
      title: 'Abonnement confirmé.',
      message: 'Merci ! Vous recevrez les prochaines publications.',
      action: { label: 'Lire le blog', to: '/blog' },
    },
    invalide: {
      kicker: 'Newsletter · confirmation',
      symbol: '!',
      title: 'Lien invalide.',
      message:
        'Ce lien de confirmation est invalide ou a déjà été remplacé. Inscrivez-vous de nouveau depuis l’accueil pour recevoir un nouveau courriel.',
      action: { label: 'Retour à l’accueil', to: '/' },
    },
  },
  unsubscribe: {
    ok: {
      kicker: 'Newsletter · désinscription',
      symbol: '✓',
      title: 'Désinscription effectuée.',
      message:
        'Vous ne recevrez plus de courriels. Vous pouvez vous réabonner à tout moment depuis l’accueil.',
      action: { label: 'Retour à l’accueil', to: '/' },
    },
    invalide: {
      kicker: 'Newsletter · désinscription',
      symbol: '!',
      title: 'Lien invalide.',
      message:
        'Ce lien de désinscription est invalide. Utilisez le lien du dernier courriel reçu, ou écrivez-moi depuis la page Contact.',
      action: { label: 'Me contacter', to: '/contact' },
    },
  },
};

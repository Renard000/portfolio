import { PUBLICATION_LABELS } from '../domain/entities/Publication.js';

const PUBLICATION_VARIABLES = ['titre', 'extrait', 'site'];

const publication = (key, name, subject, body, ctaLabel) => ({
  label: name,
  group: 'Publications',
  variables: PUBLICATION_VARIABLES,
  subject,
  heading: '{{titre}}',
  body,
  ctaLabel,
  key,
});

/** Modèles par défaut. L'admin les remplace un par un (table email_templates). */
export const DEFAULT_TEMPLATES = {
  confirmation: {
    label: 'Confirmation d’abonnement',
    group: 'Abonnement',
    variables: ['site'],
    subject: 'Confirmez votre abonnement',
    heading: 'Plus qu’une étape',
    body:
      'Bonjour,\n\n' +
      'Vous avez demandé à recevoir mes nouvelles publications. Confirmez votre adresse pour finaliser votre abonnement.\n\n' +
      'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce courriel : vous ne recevrez rien.',
    ctaLabel: 'Confirmer mon abonnement',
  },
  reply: {
    label: 'Réponse à un message',
    group: 'Contact',
    variables: ['nom', 'sujet', 'site'],
    subject: 'Re : {{sujet}}',
    heading: 'Réponse à votre message',
    body:
      'Bonjour {{nom}},\n\n' +
      'Merci pour votre message.\n\n\n\n' +
      'Au plaisir d’échanger avec vous.',
    ctaLabel: null,
  },
  news: {
    label: 'News aux abonnés',
    group: 'Abonnement',
    variables: ['site'],
    subject: 'Des nouvelles de mon portfolio',
    heading: 'Quoi de neuf ?',
    body: 'Bonjour,\n\nVoici les dernières nouvelles.',
    ctaLabel: 'En savoir plus',
  },
  article: publication(
    'article',
    'Nouvel article',
    `${PUBLICATION_LABELS.article} : {{titre}}`,
    'Un nouvel article vient de paraître sur le blog.\n\n{{extrait}}',
    'Lire l’article'
  ),
  video: publication(
    'video',
    'Nouvelle vidéo',
    `${PUBLICATION_LABELS.video} : {{titre}}`,
    'Une nouvelle vidéo est disponible.\n\n{{extrait}}',
    'Regarder la vidéo'
  ),
  series: publication(
    'series',
    'Nouvelle formation',
    `${PUBLICATION_LABELS.series} : {{titre}}`,
    'Une nouvelle formation vient d’ouvrir.\n\n{{extrait}}',
    'Découvrir la formation'
  ),
  certification: publication(
    'certification',
    'Nouvelle certification',
    `${PUBLICATION_LABELS.certification} : {{titre}}`,
    'Je viens d’obtenir une nouvelle certification.\n\nÉmetteur : {{extrait}}',
    'Voir les certifications'
  ),
  award: publication(
    'award',
    'Nouvelle distinction',
    `${PUBLICATION_LABELS.award} : {{titre}}`,
    'J’ai le plaisir de partager une nouvelle distinction.\n\nOrganisme : {{extrait}}',
    'Voir les distinctions'
  ),
  project: publication(
    'project',
    'Nouveau projet',
    `${PUBLICATION_LABELS.project} : {{titre}}`,
    'Un nouveau projet vient d’être ajouté à mon portfolio.\n\n{{extrait}}',
    'Découvrir le projet'
  ),
};

/** Valeurs fictives de l'aperçu dans l'admin. */
export const SAMPLE_VARIABLES = {
  titre: 'Titre de la publication',
  extrait: 'Un court résumé de la publication, tel qu’il apparaîtra dans le courriel.',
  nom: 'Marie',
  sujet: 'Votre demande de mandat',
};

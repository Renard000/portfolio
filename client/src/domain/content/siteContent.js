/**
 * CONTENU ÉDITABLE du portfolio (profil, compétences, parcours, projets).
 * Remplacez chaque texte entre [crochets]. Pas besoin de base de données pour
 * ce contenu : plus tard, ce fichier pourra être remplacé par un appel à l'API
 * (seul ContentService changera).
 */

import imgFlo from '../../assets/imgFlo.png';
export const profile = {
  name: 'Florwensky Paniague',
  initials: 'FP',
  role: 'développeur full-stack',
  city: 'Montréal, Québec',
  availability: 'Disponible pour de nouveaux mandats',
  intro:
    'Je conçois des produits web rapides, accessibles et soignés, du pixel jusqu’à l’API. React, Node, Supabase, AWS.',
  bio: 'étudiant en informatique',
  email: 'pflorwensky@gmail.com',
  cvUrl: '',
  photoUrl: imgFlo,
  links: { github: 'https://github.com/Renard000', linkedin: 'https://www.linkedin.com/in/florwensky-paniague-63b80622a' },
  tech: ['React', 'Redux Toolkit', 'Node.js', 'Supabase', 'AWS', 'Firebase'],
  skills: [
    { name: 'React et Redux Toolkit', level: 90 },
    { name: 'Node.js et Express', level: 85 },
    { name: 'Supabase et PostgreSQL', level: 80 },
    { name: 'AWS (S3, CloudFront)', level: 70 },
    { name: 'UX et accessibilité', level: 78 },
  ],

  timeline: [
    {
      period: '2025 — auj.',
      title: '[Poste actuel]',
      detail: '[Entreprise] · réalisations clés à compléter',
    },
    {
      period: '2023 — 2025',
      title: '[Poste précédent]',
      detail: '[Entreprise] · réalisations clés à compléter',
    },
    {
      period: '2020 — 2023',
      title: '[Diplôme / formation]',
      detail: '[Établissement] · mention, bourses',
    },
  ],

  values: [
    {
      title: 'Code propre',
      detail: 'Architecture en couches, tests, intégration continue.',
    },
    { title: 'UX d’abord', detail: 'Accessibilité et performance mesurées.' },
    { title: 'Livraison continue', detail: 'Petites itérations, démos fréquentes.' },
  ],
};

/** kind : 0 fenêtre, 1 mobile, 2 graphique (forme de la vignette dessinée). */
export const projects = [
  {
    slug: 'plateforme-de-reservation',
    title: 'Plateforme de réservation',
    category: 'Web',
    year: 2026,
    role: '[Votre rôle]',
    duration: '[3 mois]',
    summary: '[Une phrase qui résume le projet et son résultat.]',
    challenge: '[Contexte, problème et contraintes du projet.]',
    solution: '[Approche, architecture, décisions clés.]',
    tech: ['React', 'Node', 'Supabase', 'Stripe'],
    results: [
      { value: 40, label: '[Indicateur 1]' },
      { value: 3, label: '[Indicateur 2]' },
      { value: 99, label: '[Indicateur 3]' },
    ],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    color: '#3b2f8f',
    kind: 0,
  },
  {
    slug: 'application-mobile-sante',
    title: 'Application mobile santé',
    category: 'Mobile',
    year: 2025,
    role: '[Votre rôle]',
    duration: '[4 mois]',
    summary: '[Une phrase qui résume le projet et son résultat.]',
    challenge: '[Contexte, problème et contraintes du projet.]',
    solution: '[Approche, architecture, décisions clés.]',
    tech: ['PWA', 'FCM'],
    results: [],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    color: '#0f5e4d',
    kind: 1,
  },
  {
    slug: 'tableau-de-bord-analytique',
    title: 'Tableau de bord analytique',
    category: 'Data',
    year: 2025,
    role: '[Votre rôle]',
    duration: '[2 mois]',
    summary: '[Une phrase qui résume le projet et son résultat.]',
    challenge: '[Contexte, problème et contraintes du projet.]',
    solution: '[Approche, architecture, décisions clés.]',
    tech: ['D3', 'Express'],
    results: [],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    color: '#8a3a24',
    kind: 2,
  },
  {
    slug: 'assistant-ia-documentaire',
    title: 'Assistant IA documentaire',
    category: 'IA',
    year: 2024,
    role: '[Votre rôle]',
    duration: '[2 mois]',
    summary: '[Une phrase qui résume le projet et son résultat.]',
    challenge: '[Contexte, problème et contraintes du projet.]',
    solution: '[Approche, architecture, décisions clés.]',
    tech: ['Python', 'API'],
    results: [],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    color: '#24507a',
    kind: 0,
  },
];

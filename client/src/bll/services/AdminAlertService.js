const ALERTS = {
  messages: (r) => ({
    title: 'Nouveau message',
    text: `${r.nom}${r.sujet ? ` : ${r.sujet}` : ''}`,
    to: '/admin/messages',
  }),
  comments: (r) => ({
    title: 'Nouveau commentaire à modérer',
    text: r.author,
    to: '/admin/commentaires',
  }),
  subscribers: (r) => ({
    title: 'Nouvelle inscription à la newsletter',
    text: r.email,
    to: '/admin/abonnes',
  }),
};

/** Alertes de l'admin connecté. Les RLS réservent ces tables au rôle admin. */
export default class AdminAlertService {
  constructor(realtimeClient) {
    this.realtime = realtimeClient;
  }

  /** callback(table, alerte) à chaque insertion ; renvoie la fonction de désabonnement. */
  subscribe(callback) {
    const stops = Object.entries(ALERTS).map(([table, toAlert]) =>
      this.realtime.onInsert(table, (row) => callback(table, toAlert(row)))
    );
    return () => stops.forEach((stop) => stop());
  }
}

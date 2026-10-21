const page = (title, message) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
  `<body style="font-family:Arial,sans-serif;max-width:480px;margin:4rem auto;text-align:center">` +
  `<h1>${title}</h1><p>${message}</p></body></html>`;

export default class NewsletterController {
  constructor(newsletterService, pushSubscriptionService) {
    this.newsletterService = newsletterService;
    this.pushSubscriptionService = pushSubscriptionService;
  }

  async subscribe(req, res) {
    res.status(202).json(await this.newsletterService.subscribe(req.validated.body));
  }

  // Pages HTML statiques (aucune donnée de l'utilisateur n'y est insérée).
  async confirm(req, res) {
    await this.newsletterService.confirm(req.validated.query.token);
    res
      .type('html')
      .send(
        page('Abonnement confirmé', 'Merci ! Vous recevrez les prochaines publications.')
      );
  }

  async unsubscribe(req, res) {
    await this.newsletterService.unsubscribe(req.validated.query.token);
    res
      .type('html')
      .send(page('Désinscription effectuée', 'Vous ne recevrez plus de courriels.'));
  }

  async pushSubscribe(req, res) {
    res
      .status(201)
      .json(await this.pushSubscriptionService.subscribe(req.validated.body.token));
  }
}

import { NotFoundError } from '../../domain/errors/index.js';

const page = (title, message) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
  `<body style="font-family:Arial,sans-serif;max-width:480px;margin:4rem auto;text-align:center">` +
  `<h1>${title}</h1><p>${message}</p></body></html>`;

/** Pages du site (maquette P-14 « Newsletter · confirmation ») vers lesquelles on redirige. */
const SITE_PAGES = {
  confirm: '/newsletter/confirmation',
  unsubscribe: '/newsletter/desinscription',
};

export default class NewsletterController {
  /**
   * @param options.siteUrl adresse du site : si elle est fournie, les liens des courriels
   *   redirigent vers les pages du site ; sinon une page HTML minimale est renvoyée.
   */
  constructor(newsletterService, pushSubscriptionService, { siteUrl = '' } = {}) {
    this.newsletterService = newsletterService;
    this.pushSubscriptionService = pushSubscriptionService;
    this.siteUrl = siteUrl.replace(/\/+$/, '');
  }

  async subscribe(req, res) {
    res.status(202).json(await this.newsletterService.subscribe(req.validated.body));
  }

  // Aucune donnée de l'utilisateur n'est insérée dans les pages ni dans les adresses.
  async confirm(req, res) {
    await this.#respond(res, 'confirm', () =>
      this.newsletterService.confirm(req.validated.query.token)
    );
  }

  async unsubscribe(req, res) {
    await this.#respond(res, 'unsubscribe', () =>
      this.newsletterService.unsubscribe(req.validated.query.token)
    );
  }

  async #respond(res, action, run) {
    if (!this.siteUrl) {
      await run();
      return action === 'confirm'
        ? res
            .type('html')
            .send(
              page(
                'Abonnement confirmé',
                'Merci ! Vous recevrez les prochaines publications.'
              )
            )
        : res
            .type('html')
            .send(
              page('Désinscription effectuée', 'Vous ne recevrez plus de courriels.')
            );
    }
    let status = 'ok';
    try {
      await run();
    } catch (err) {
      if (!(err instanceof NotFoundError)) throw err;
      status = 'invalide';
    }
    res.redirect(303, `${this.siteUrl}${SITE_PAGES[action]}?statut=${status}`);
  }

  async pushSubscribe(req, res) {
    res
      .status(201)
      .json(await this.pushSubscriptionService.subscribe(req.validated.body.token));
  }
}

export default class ContactController {
  constructor(contactService) {
    this.service = contactService;
  }

  async send(req, res) {
    res.status(201).json(await this.service.send(req.validated.body));
  }
}

import Certification from './Certification.js';
import Award from './Award.js';

const NOW = new Date('2026-06-15T12:00:00Z');

describe('Certification (modèle)', () => {
  const c = (o) =>
    new Certification({
      id: '1',
      title: 't',
      issuer: 'i',
      issueDate: '2024-03-15',
      ...o,
    });
  it('statut : Valide / Expirée / Sans expiration', () => {
    expect(c({}).status(NOW)).toBe('no-expiry');
    expect(c({ expiryDate: '2027-01-01' }).status(NOW)).toBe('valid');
    expect(c({ expiryDate: '2025-01-01' }).status(NOW)).toBe('expired');
    expect(c({ expiryDate: '2025-01-01' }).statusLabel(NOW)).toBe('Expirée');
    expect(c({}).statusLabel(NOW)).toBe('Sans expiration');
  });
  it('isExpired : le jour même reste valide', () => {
    expect(c({ expiryDate: '2026-06-15' }).isExpired(NOW)).toBe(false);
    expect(c({ expiryDate: '2026-06-14' }).isExpired(NOW)).toBe(true);
  });
  it('formate la date en français sans décalage de fuseau', () => {
    expect(c({}).formattedIssueDate()).toMatch(/15 mars 2024/);
    expect(Certification.formatDate(null)).toBe('');
  });
  it('compétences par défaut, détection de PDF', () => {
    expect(c({}).skills).toEqual([]);
    expect(c({ documentUrl: 'https://x/y.pdf' }).isPdfDocument()).toBe(true);
    expect(c({ documentUrl: 'https://x/y.png' }).isPdfDocument()).toBe(false);
  });
});

describe('Award (modèle)', () => {
  it('formattedAmount en devise, année, libellé du type', () => {
    const a = new Award({
      awardedAt: '2023-09-10',
      type: 'scholarship',
      amount: 2500,
      currency: 'CAD',
    });
    expect(a.year).toBe(2023);
    expect(a.typeLabel()).toBe('Bourse');
    expect(a.formattedAmount().replace(/\s/g, ' ')).toMatch(/2 500,00\s?\$/);
  });
  it('sans montant : chaîne vide', () => {
    const a = new Award({ awardedAt: '2023-09-10', type: 'honor' });
    expect(a.hasAmount()).toBe(false);
    expect(a.formattedAmount()).toBe('');
  });
});

describe("modèles construits depuis le JSON RÉEL de l'API (champs calculés inclus)", () => {
  it("Certification : le champ status de l'API ne masque pas la méthode status()", () => {
    const fromApi = {
      id: '1',
      title: 't',
      issuer: 'i',
      issueDate: '2020-01-01',
      expiryDate: '2021-01-01',
      status: 'valid' /* périmé côté serveur */,
    };
    const c = new Certification(fromApi);
    expect(typeof c.status).toBe('function');
    expect(c.status(NOW)).toBe('expired'); // recalculé à la date du jour
  });
  it("Award : le champ year de l'API ne fait pas planter le constructeur", () => {
    const a = new Award({
      id: '1',
      title: 't',
      organization: 'o',
      awardedAt: '2023-09-10',
      year: 1999,
    });
    expect(a.year).toBe(2023);
  });
});

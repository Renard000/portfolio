import { render, screen, waitFor } from '@testing-library/react';
import withContentProtection from './views/components/withContentProtection.jsx';
import { renderApp } from './testUtils.jsx';

const Page = () => (
  <div>
    <p>Texte protégé</p>
    <input aria-label="champ" />
    <textarea aria-label="zone" />
    <div
      contentEditable
      suppressContentEditableWarning
      aria-label="editable"
      role="textbox"
    />
  </div>
);
const Protected = withContentProtection(Page);

const fire = (el, type) => {
  const e = new Event(type, { bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e.defaultPrevented;
};

describe('withContentProtection (HOC, addendum E.6)', () => {
  it('bloque copie, coupe, clic droit, glisser et sélection sur le contenu', () => {
    render(<Protected />);
    const text = screen.getByText('Texte protégé');
    for (const t of ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'])
      expect(fire(text, t), t).toBe(true);
  });
  it('laisse les champs de formulaire et zones éditables utilisables', () => {
    render(<Protected />);
    for (const el of [
      screen.getByLabelText('champ'),
      screen.getByLabelText('zone'),
      screen.getByLabelText('editable'),
    ])
      for (const t of ['copy', 'cut', 'contextmenu', 'selectstart'])
        expect(fire(el, t), t).toBe(false);
  });
  it('ne touche pas au clavier (navigation et accessibilité)', () => {
    render(<Protected />);
    const e = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    screen.getByText('Texte protégé').dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });
  it("enveloppe dans .protected-content, transmet les props, nom d'affichage lisible", () => {
    const Inner = ({ label }) => <p>{label}</p>;
    const Wrapped = withContentProtection(Inner);
    const { container } = render(<Wrapped label="bonjour" />);
    expect(container.querySelector('.protected-content')).toHaveTextContent('bonjour');
    expect(Wrapped.displayName).toBe('withContentProtection(Inner)');
  });
  it('retire ses écouteurs au démontage', () => {
    const { unmount } = render(<Protected />);
    const text = screen.getByText('Texte protégé');
    const root = text.closest('.protected-content');
    const spy = vi.spyOn(root, 'removeEventListener');
    unmount();
    expect(spy.mock.calls.map((c) => c[0]).sort()).toEqual([
      'contextmenu',
      'copy',
      'cut',
      'dragstart',
      'selectstart',
    ]);
  });
});

describe('Pages protégées / non protégées', () => {
  beforeEach(() => {
    window.matchMedia = () => ({ matches: true });
  });
  afterEach(() => {
    delete window.matchMedia;
  });
  const protectedAt = (path) =>
    renderApp(path).container.querySelector('.protected-content');

  it.each([
    '/',
    '/a-propos',
    '/projets',
    '/formations',
    '/certifications',
    '/distinctions',
  ])('%s est protégée', (path) => {
    expect(protectedAt(path)).not.toBeNull();
  });
  it("le contact, l'admin et les pages légales ne le sont pas", () => {
    expect(protectedAt('/contact')).toBeNull();
    expect(protectedAt('/admin/login')).toBeNull();
    expect(protectedAt('/conditions')).toBeNull();
  });
  
  it('le clic droit est bloqué sur une page de contenu et permis dans le formulaire de contact', async () => {
    const { container } = renderApp('/a-propos');

    await waitFor(() => {
      expect(container.querySelector('main')).not.toBeNull();
    });

    expect(fire(container.querySelector('main'), 'contextmenu')).toBe(true);

    const c = renderApp('/contact');

    // Attendre le chargement de la page avant de chercher le textarea.
    await waitFor(() => {
      expect(c.container.querySelector('textarea')).not.toBeNull();
    });

    const textarea = c.container.querySelector('textarea');

    expect(fire(textarea, 'contextmenu')).toBe(false);
  });
});

describe('Pages légales et pied de page', () => {
  it('conditions : interdit téléchargement, copie, redistribution et extraction automatisée', async () => {
    renderApp('/conditions');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Conditions d’utilisation/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/téléchargement des vidéos/)).toBeInTheDocument();
    expect(screen.getByText(/extraction automatisée/)).toBeInTheDocument();
  });
  it('confidentialité : journal des lectures, droits, stockage local', () => {
    renderApp('/confidentialite');
    expect(
      screen.getByRole('heading', { level: 1, name: /Politique de confidentialité/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Journal des lectures' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Conservation et droits/ })
    ).toBeInTheDocument();
  });
  it('le pied de page affiche © + année et mène aux deux pages légales', () => {
    renderApp('/');
    const foot = screen.getByRole('contentinfo');
    expect(foot).toHaveTextContent(new RegExp(`© ${new Date().getFullYear()}`));
    expect(foot.querySelector('a[href="/conditions"]')).not.toBeNull();
    expect(foot.querySelector('a[href="/confidentialite"]')).not.toBeNull();
    expect(foot.querySelector('a[href="/formations"]')).not.toBeNull();
  });
});

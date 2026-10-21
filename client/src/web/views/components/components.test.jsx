/* eslint-disable no-restricted-syntax -- vi.useFakeTimers / vi.useRealTimers sont des API Vitest, pas des hooks React */
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { Component } from 'react';
import Modal from './Modal.jsx';
import AnimatedCounter from './AnimatedCounter.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import withLoader from './withLoader.jsx';
import DataFetcher from './DataFetcher.jsx';
import CertificationCarousel from './CertificationCarousel.jsx';
import CertificationCard from './CertificationCard.jsx';
import CertificationDetail from './CertificationDetail.jsx';
import AwardTimeline from './AwardTimeline.jsx';
import RevealOnScroll from './RevealOnScroll.jsx';
import DataTable, { filterSortRows } from './DataTable.jsx';
import { CERTS, AWARDS } from '../../testUtils.jsx';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Modal (Portal)', () => {
  it('se rend dans document.body, hors du conteneur React', () => {
    const { container } = render(
      <Modal title="Titre" onClose={() => {}}>
        Contenu
      </Modal>
    );
    expect(container.querySelector('[role=dialog]')).toBeNull();
    expect(
      within(document.body).getByRole('dialog', { name: 'Titre' })
    ).toBeInTheDocument();
  });
  it('Échap, bouton Fermer et clic sur le fond ferment ; clic dans la boîte ne ferme pas', () => {
    const onClose = vi.fn();
    render(
      <Modal title="T" onClose={onClose}>
        Corps
      </Modal>
    );
    fireEvent.click(screen.getByText('Corps'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(document.querySelector('.modal.show'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
  it("au démontage : retire le portail, l'écouteur clavier et la classe modal-open", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal title="T" onClose={onClose}>
        x
      </Modal>
    );
    expect(document.body.classList.contains('modal-open')).toBe(true);
    unmount();
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(document.body.classList.contains('modal-open')).toBe(false);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('AnimatedCounter', () => {
  it("compte jusqu'à la valeur avec setInterval puis s'arrête", () => {
    vi.useFakeTimers();
    render(<AnimatedCounter value={10} duration={800} steps={20} />);
    expect(screen.getByLabelText('10').textContent).toBe('0');
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const mid = Number(screen.getByLabelText('10').textContent);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(10);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('10').textContent).toBe('10');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('repart quand la valeur change', () => {
    vi.useFakeTimers();
    const { rerender } = render(<AnimatedCounter value={4} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<AnimatedCounter value={8} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('8').textContent).toBe('8');
  });
  it('nettoie son minuteur au démontage (pas de fuite)', () => {
    vi.useFakeTimers();
    const { unmount } = render(<AnimatedCounter value={50} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("affiche directement la valeur si l'utilisateur réduit les animations", () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<AnimatedCounter value={7} />);
    expect(screen.getByLabelText('7').textContent).toBe('7');
  });
});

describe('ErrorBoundary', () => {
  class Bomb extends Component {
    render() {
      if (this.props.explode) throw new Error('boom');
      return <p>ok</p>;
    }
  }
  it("isole l'erreur et permet de réessayer", () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <div>
        <ErrorBoundary message="Section KO">
          <Bomb explode />
        </ErrorBoundary>
        <p>voisin</p>
      </div>
    );
    expect(screen.getByText(/Section KO/)).toBeInTheDocument();
    expect(screen.getByText('voisin')).toBeInTheDocument();
    rerender(
      <div>
        <ErrorBoundary message="Section KO">
          <Bomb />
        </ErrorBoundary>
        <p>voisin</p>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(screen.getByText('ok')).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('withLoader (HOC)', () => {
  const Inner = ({ label }) => <p>{label}</p>;
  const Wrapped = withLoader(Inner);
  it('chargement sans données : spinner', () => {
    render(<Wrapped loading hasData={false} label="x" />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
    expect(screen.queryByText('x')).toBeNull();
  });
  it('erreur sans données : alerte', () => {
    render(<Wrapped error="Panne" hasData={false} label="x" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Panne');
  });
  it("rechargement avec données déjà là : garde l'affichage", () => {
    render(<Wrapped loading hasData label="visible" />);
    expect(screen.getByText('visible')).toBeInTheDocument();
  });
  it('donne un displayName lisible', () => {
    expect(Wrapped.displayName).toBe('withLoader(Inner)');
  });
});

describe('DataFetcher (render props)', () => {
  it('loading → data', async () => {
    const load = vi.fn().mockResolvedValue({ n: 5 });
    render(
      <DataFetcher load={load}>
        {({ data, loading }) => (loading ? <p>…</p> : <p>n={data.n}</p>)}
      </DataFetcher>
    );
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(await screen.findByText('n=5')).toBeInTheDocument();
  });
  it('erreur → message, et retry relance', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('KO'))
      .mockResolvedValueOnce('bon');
    render(
      <DataFetcher load={load}>
        {({ data, error, retry }) =>
          error ? <button onClick={retry}>{error}</button> : <p>{data}</p>
        }
      </DataFetcher>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'KO' }));
    expect(await screen.findByText('bon')).toBeInTheDocument();
  });
  it('ignore la réponse après démontage (pas de setState)', async () => {
    let resolve;
    const load = () => new Promise((r) => (resolve = r));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<DataFetcher load={load}>{() => <p>x</p>}</DataFetcher>);
    unmount();
    await act(async () => resolve('tard'));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('CertificationCard / Detail', () => {
  it('affiche titre, émetteur, date en français et badge de statut', () => {
    render(<CertificationCard certification={CERTS[1]} onOpen={() => {}} />);
    expect(screen.getByText('Scrum Master')).toBeInTheDocument();
    expect(screen.getByText('Expirée')).toBeInTheDocument();
    expect(screen.getByText(/1 juin 2022/)).toBeInTheDocument();
  });
  it('clic → onOpen avec la certification', () => {
    const onOpen = vi.fn();
    render(<CertificationCard certification={CERTS[0]} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /détail/i }));
    expect(onOpen).toHaveBeenCalledWith(CERTS[0]);
  });
  it('est un PureComponent : pas de re-rendu pour les mêmes props', () => {
    const spy = vi.spyOn(CertificationCard.prototype, 'render');
    const onOpen = () => {};
    const { rerender } = render(
      <CertificationCard certification={CERTS[0]} onOpen={onOpen} />
    );
    rerender(<CertificationCard certification={CERTS[0]} onOpen={onOpen} />);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
  it('détail : identifiant, compétences, lien de vérification sûr', () => {
    render(<CertificationDetail certification={CERTS[0]} />);
    expect(screen.getByText('AWS-123')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Vérifier la certification/ });
    expect(link).toHaveAttribute('href', 'https://verif.example/aws');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
  it("détail : un lien javascript: n'est JAMAIS rendu", () => {
    render(<CertificationDetail certification={CERTS[1]} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('détail : PDF intégré dans un iframe', () => {
    render(<CertificationDetail certification={CERTS[2]} />);
    expect(screen.getByTitle(/Document Cybersécurité/)).toHaveAttribute(
      'src',
      'https://cdn.example/doc.pdf'
    );
  });
});

describe('CertificationCarousel', () => {
  const items = CERTS;
  const pos = () => screen.getByText(/^\d+ \/ \d+$/).textContent;

  it('boutons suivant / précédent avec retour en boucle', () => {
    render(<CertificationCarousel items={items} onOpen={() => {}} />);
    expect(pos()).toBe('1 / 3');
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }));
    expect(pos()).toBe('2 / 3');
    fireEvent.click(screen.getByRole('button', { name: 'Précédente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Précédente' }));
    expect(pos()).toBe('3 / 3');
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }));
    expect(pos()).toBe('1 / 3');
  });
  it('flèches du clavier (écouteur de document)', () => {
    render(<CertificationCarousel items={items} onOpen={() => {}} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(pos()).toBe('2 / 3');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(pos()).toBe('1 / 3');
  });
  it('les flèches tapées dans un champ de saisie ne font PAS défiler', () => {
    render(
      <div>
        <input aria-label="champ" />
        <CertificationCarousel items={items} onOpen={() => {}} />
      </div>
    );
    fireEvent.keyDown(screen.getByLabelText('champ'), { key: 'ArrowRight' });
    expect(pos()).toBe('1 / 3');
  });
  it("retire l'écouteur clavier au démontage", () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<CertificationCarousel items={items} onOpen={() => {}} />);
    unmount();
    const added = add.mock.calls.filter((c) => c[0] === 'keydown').map((c) => c[1]);
    const removed = remove.mock.calls.filter((c) => c[0] === 'keydown').map((c) => c[1]);
    expect(added.some((fn) => removed.includes(fn))).toBe(true);
    add.mockRestore();
    remove.mockRestore();
  });
  it('getDerivedStateFromProps : revient à la première carte quand la liste change', () => {
    const { rerender } = render(
      <CertificationCarousel items={items} onOpen={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }));
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }));
    expect(pos()).toBe('3 / 3');
    rerender(<CertificationCarousel items={[items[0], items[1]]} onOpen={() => {}} />);
    expect(pos()).toBe('1 / 2');
  });
  it('une liste vide affiche un message, sans erreur', () => {
    render(<CertificationCarousel items={[]} onOpen={() => {}} />);
    expect(screen.getByText(/Aucune certification/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
  });
  it('scrolle le point actif en vue via sa Ref', () => {
    const scroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scroll;
    render(<CertificationCarousel items={items} onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }));
    expect(scroll).toHaveBeenCalled();
    delete window.HTMLElement.prototype.scrollIntoView;
  });
});

describe('AwardTimeline (shouldComponentUpdate) et RevealOnScroll', () => {
  const groups = (items) => [{ year: 2024, items }];

  it('ne se re-rend pas si les données sont identiques, se re-rend si elles changent', () => {
    const spy = vi.spyOn(AwardTimeline.prototype, 'render');
    const onSelect = () => {};
    const a = AWARDS.items.slice(0, 2);
    const { rerender } = render(<AwardTimeline groups={groups(a)} onSelect={onSelect} />);
    expect(spy).toHaveBeenCalledTimes(1);
    rerender(
      <AwardTimeline groups={groups(a.map((x) => ({ ...x })))} onSelect={onSelect} />
    ); // nouvelle référence, mêmes données
    expect(spy).toHaveBeenCalledTimes(1);
    rerender(<AwardTimeline groups={groups([a[0]])} onSelect={onSelect} />);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
  it('regroupe par année avec un titre par année', () => {
    render(
      <AwardTimeline
        groups={[
          { year: 2024, items: [AWARDS.items[0]] },
          { year: 2022, items: [AWARDS.items[2]] },
        ]}
        onSelect={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: '2024' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2022' })).toBeInTheDocument();
  });
  it('message si aucune distinction', () => {
    render(<AwardTimeline groups={[]} onSelect={() => {}} />);
    expect(screen.getByText(/Aucune distinction/)).toBeInTheDocument();
  });

  it("RevealOnScroll : caché jusqu'à l'intersection, puis visible, et se déconnecte", () => {
    let callback;
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb) {
          callback = cb;
        }
        observe = observe;
        disconnect = disconnect;
      }
    );
    const { container, unmount } = render(
      <RevealOnScroll>
        <p>contenu</p>
      </RevealOnScroll>
    );
    const root = container.firstChild;
    expect(root.className).not.toContain('reveal--visible');
    expect(observe).toHaveBeenCalledWith(root);
    act(() => {
      callback([{ isIntersecting: false }]);
    });
    expect(root.className).not.toContain('reveal--visible');
    act(() => {
      callback([{ isIntersecting: true }]);
    });
    expect(root.className).toContain('reveal--visible');
    expect(disconnect).toHaveBeenCalled();
    unmount();
  });
  it('RevealOnScroll : sans IntersectionObserver (vieux navigateur/jsdom), visible tout de suite', () => {
    const { container } = render(
      <RevealOnScroll>
        <p>c</p>
      </RevealOnScroll>
    );
    expect(container.firstChild.className).toContain('reveal--visible');
  });
  it("RevealOnScroll : déconnecte l'observateur au démontage", () => {
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect = disconnect;
      }
    );
    render(
      <RevealOnScroll>
        <p>c</p>
      </RevealOnScroll>
    ).unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'name', label: 'Nom', value: (r) => r.name },
    { key: 'n', label: 'Nombre', value: (r) => r.n },
  ];
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: String(i),
    name: i === 3 ? 'Éléonore' : `Ligne ${String(i).padStart(2, '0')}`,
    n: i,
  }));

  it('filterSortRows : recherche sans accents/casse, tri texte et numérique', () => {
    expect(filterSortRows(rows, columns, { query: 'eleonore' }).map((r) => r.id)).toEqual(
      ['3']
    );
    expect(filterSortRows(rows, columns, { sortKey: 'n', sortDir: 'desc' })[0].n).toBe(
      24
    );
    expect(
      filterSortRows(
        [
          { id: 'a', n: 10 },
          { id: 'b', n: 9 },
        ],
        columns,
        { sortKey: 'n' }
      ).map((r) => r.id)
    ).toEqual(['b', 'a']);
    expect(filterSortRows(rows, columns, { query: '' })).toBe(rows);
  });
  it('pagine par 10 et navigue', () => {
    render(<DataTable rows={rows} columns={columns} />);
    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
  });
  it('la recherche filtre et revient à la page 1', () => {
    render(<DataTable rows={rows} columns={columns} />);
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.change(screen.getByLabelText('Rechercher dans le tableau'), {
      target: { value: 'ligne 07' },
    });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('1 ligne')).toBeInTheDocument();
  });
  it("clic sur l'en-tête : tri croissant puis décroissant (aria-sort)", () => {
    render(<DataTable rows={rows.slice(0, 3)} columns={columns} />);
    const header = screen.getByRole('columnheader', { name: /Nombre/ });
    fireEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Ligne 02');
  });
  it('export CSV : reçoit TOUTES les lignes filtrées (pas seulement la page)', () => {
    const onExport = vi.fn();
    render(<DataTable rows={rows} columns={columns} onExport={onExport} />);
    fireEvent.click(screen.getByRole('button', { name: /Exporter CSV/ }));
    expect(onExport.mock.calls[0][0]).toHaveLength(25);
    fireEvent.change(screen.getByLabelText('Rechercher dans le tableau'), {
      target: { value: 'ligne 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Exporter CSV/ }));
    expect(onExport.mock.calls[1][0]).toHaveLength(10);
  });
  it('liste vide : message, export désactivé', () => {
    render(
      <DataTable
        rows={[]}
        columns={columns}
        onExport={() => {}}
        emptyMessage="Rien ici"
      />
    );
    expect(screen.getByText('Rien ici')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exporter CSV/ })).toBeDisabled();
  });
  it("page clampée quand la liste rétrécit (suppression de la dernière ligne d'une page)", () => {
    const { rerender } = render(<DataTable rows={rows.slice(0, 11)} columns={columns} />);
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    rerender(<DataTable rows={rows.slice(0, 10)} columns={columns} />);
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(11);
  });
});

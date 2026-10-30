import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

describe('App', () => {
  beforeEach(() => {
    // Aucun réseau dans les tests : l'accueil charge certifications et distinctions.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '[]',
        json: async () => [],
      })
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("affiche la page d'accueil", async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', { level: 1, name: /full-stack/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Recevoir mes nouvelles publications/ })
    ).toBeInTheDocument();
  });
});

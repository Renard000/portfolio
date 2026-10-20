import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

describe('App', () => {
  it("affiche la page d'accueil", () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /portfolio/i })).toBeInTheDocument();
  });
});

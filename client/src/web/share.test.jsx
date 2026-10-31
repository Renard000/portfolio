import { render, screen, fireEvent } from '@testing-library/react';
import ShareMenu from './views/components/ShareMenu.jsx';
import ArticleService from '../bll/services/ArticleService.js';
import { ui } from '../domain/content/en.js';

const URL = 'https://exemple.ca/blog/mon-article';

describe('Partage d’un article', () => {
  it('ouvre le menu, copie le lien et se ferme avec Échap', () => {
    const onCopy = vi.fn();
    render(
      <ShareMenu
        url={URL}
        links={ArticleService.shareLinks(URL, 'Mon article')}
        copied={false}
        onCopy={onCopy}
      />
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));
    expect(screen.getByLabelText('Lien de l’article')).toHaveValue(URL);
    fireEvent.click(screen.getByRole('button', { name: 'Copier le lien' }));
    expect(onCopy).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(URL))
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('chaque lien de partage est traduit', () => {
    const french = ArticleService.shareLinks(URL, 'T').filter(
      (l) => l.label === 'Courriel'
    );
    expect(french).toHaveLength(1);
    expect(ui.Courriel).toBe('Email');
  });
});

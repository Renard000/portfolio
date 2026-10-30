import { PureComponent } from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_NAME } from '../../../domain/content/seoContent.js';

/** Titre et description de la page ; le rendu le plus profond a priorité. */
export default class PageMeta extends PureComponent {
  render() {
    const { title, description, type, noindex } = this.props;
    const fullTitle = `${title} — ${SITE_NAME}`;
    return (
      <Helmet>
        <title>{fullTitle}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={fullTitle} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:type" content={type} />
        {noindex ? <meta name="robots" content="noindex" /> : null}
      </Helmet>
    );
  }
}
PageMeta.defaultProps = { type: 'website' };

import { PureComponent, createContext } from 'react';
import { interpolate } from '../../domain/translation.js';

export const LocaleContext = createContext({
  lang: 'fr',
  locale: 'fr-CA',
  t: interpolate,
});

/** HOC : donne à une vue la langue et la traduction (`t`, `lang`, `locale`). */
export default function withLocale(Wrapped) {
  return class WithLocale extends PureComponent {
    static contextType = LocaleContext;
    static Wrapped = Wrapped;
    static displayName = `withLocale(${Wrapped.displayName || Wrapped.name || 'Component'})`;

    render() {
      const { t, lang, locale } = this.context;
      return <Wrapped {...this.props} t={t} lang={lang} locale={locale} />;
    }
  };
}

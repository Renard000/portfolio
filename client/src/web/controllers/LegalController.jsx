import { Component } from 'react';
import { legal } from '../../domain/content/legalContent.js';
import { legal as legalEn } from '../../domain/content/en.js';
import withLocale from '../context/withLocale.jsx';
import LegalPage from '../views/pages/client/LegalPage.jsx';

/** Page légale choisie par la prop `kind` du Route (conditions | confidentialite). */
class LegalController extends Component {
  render() {
    const docs = this.props.lang === 'en' ? legalEn : legal;
    return <LegalPage doc={docs[this.props.kind]} />;
  }
}

export default withLocale(LegalController);

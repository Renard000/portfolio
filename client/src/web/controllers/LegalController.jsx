import { Component } from 'react';
import { legal } from '../../domain/content/legalContent.js';
import LegalPage from '../views/pages/client/LegalPage.jsx';

/** Page légale choisie par la prop `kind` du Route (conditions | confidentialite). */
export default class LegalController extends Component {
  render() {
    return <LegalPage doc={legal[this.props.kind]} />;
  }
}

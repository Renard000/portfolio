import { PureComponent } from 'react';

export default class NotFoundPage extends PureComponent {
  render() {
    return (
      <main className="container py-5">
        <h1>404</h1>
        <p>Page introuvable.</p>
      </main>
    );
  }
}

import { PureComponent } from 'react';

export default class HomePage extends PureComponent {
  render() {
    return (
      <main className="container py-5">
        <h1 className="display-5">
          <i className="fa-solid fa-code me-2" aria-hidden="true"></i>
          Portfolio
        </h1>
        <p className="lead">
          Configuration terminée : React, Redux, Router, Bootstrap et Font Awesome sont en
          place.
        </p>
      </main>
    );
  }
}

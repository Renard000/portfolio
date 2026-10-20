import { Component } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createDependencies } from './compositionRoot.js';
import AppRouter from './routes/AppRouter.jsx';

export class App extends Component {
  constructor(props) {
    super(props);
    // Assemblage unique des dépendances, au montage de l'application
    this.deps = createDependencies();
  }

  render() {
    return (
      <Provider store={this.deps.store}>
        <HelmetProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    );
  }
}

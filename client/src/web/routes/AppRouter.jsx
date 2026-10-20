import { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import HomePage from '../views/pages/client/HomePage.jsx';
import NotFoundPage from '../views/pages/client/NotFoundPage.jsx';

export default class AppRouter extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={HomePage} />
        {/* Route sans path : page 404 (toujours en dernier) */}
        <Route component={NotFoundPage} />
      </Switch>
    );
  }
}

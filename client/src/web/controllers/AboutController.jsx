import { Component } from 'react';
import { connect } from 'react-redux';
import AboutPage from '../views/pages/client/AboutPage.jsx';

class AboutController extends Component {
  render() {
    return <AboutPage profile={this.props.profile} />;
  }
}

export default connect((state) => ({ profile: state.content.profile }))(AboutController);

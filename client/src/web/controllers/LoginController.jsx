import { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { signIn } from '../store/slices/authSlice.js';
import LoginView from '../views/components/LoginView.jsx';

class LoginController extends Component {
  submit = (email, password) => this.props.signIn({ email, password });

  render() {
    if (this.props.user) return <Redirect to="/admin/certifications" />;
    return (
      <LoginView
        loading={this.props.loading}
        error={this.props.error}
        onSubmit={this.submit}
      />
    );
  }
}

const mapState = (state) => ({
  user: state.auth.user,
  loading: state.auth.loading,
  error: state.auth.error,
});
export default connect(mapState, { signIn })(LoginController);

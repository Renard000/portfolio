import { Component } from 'react';
import { connect } from 'react-redux';
import { sendContact, resetContact } from '../store/slices/contactSlice.js';
import ContactPage from '../views/pages/client/ContactPage.jsx';

class ContactController extends Component {
  componentWillUnmount() {
    this.props.resetContact();
  }

  render() {
    const p = this.props;
    return (
      <ContactPage
        profile={p.profile}
        status={p.status}
        error={p.error}
        onSubmit={p.sendContact}
        onReset={p.resetContact}
      />
    );
  }
}

const mapState = (state) => ({
  profile: state.content.profile,
  status: state.contact.status,
  error: state.contact.error,
});
export default connect(mapState, { sendContact, resetContact })(ContactController);

import { PureComponent } from 'react';
import CertificationDetail from '../../components/CertificationDetail.jsx';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';
import FeaturedCertifications from '../../components/FeaturedCertifications.jsx';
import AwardsSummary from '../../components/AwardsSummary.jsx';
import Modal from '../../components/Modal.jsx';
import NewsletterForm from '../../components/NewsletterForm.jsx';
import PushOptIn from '../../components/PushOptIn.jsx';

export default class HomePage extends PureComponent {
  render() {
    const { featured, loadAwards, selected, onSelect, onCloseDetail } = this.props;
    const { newsletterStatus, newsletterError, onSubscribe, pushStatus, onEnablePush } =
      this.props;
    return (
      <main className="container py-5">
        <h1 className="display-5">
          <i className="fa-solid fa-code me-2" aria-hidden="true"></i>
          Portfolio
        </h1>
        <p className="lead mb-5">Projets, certifications, bourses et mérites.</p>

        <ErrorBoundary>
          <FeaturedCertifications items={featured} onOpen={onSelect} />
        </ErrorBoundary>
        <ErrorBoundary>
          {loadAwards ? <AwardsSummary load={loadAwards} /> : null}
        </ErrorBoundary>

        <section aria-labelledby="newsletter-title" className="row g-4">
          <div className="col-12 col-md-7">
            <h2 id="newsletter-title" className="h4">
              Recevoir les nouveaux articles
            </h2>
            <ErrorBoundary>
              <NewsletterForm
                status={newsletterStatus}
                error={newsletterError}
                onSubmit={onSubscribe}
              />
            </ErrorBoundary>
          </div>
          <div className="col-12 col-md-5">
            <h2 className="h4">Notifications</h2>
            <PushOptIn status={pushStatus} onEnable={onEnablePush} />
          </div>
        </section>

        {selected ? (
          <Modal title={selected.title} onClose={onCloseDetail}>
            <CertificationDetail certification={selected} />
          </Modal>
        ) : null}
      </main>
    );
  }
}
HomePage.defaultProps = { featured: [], newsletterStatus: 'idle', pushStatus: 'idle' };

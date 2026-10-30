import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AnimatedCounter from '../../components/AnimatedCounter.jsx';
import ArticleCard from '../../components/ArticleCard.jsx';
import AwardsSummary from '../../components/AwardsSummary.jsx';
import CertificationCard from '../../components/CertificationCard.jsx';
import CertificationDetail from '../../components/CertificationDetail.jsx';
import FeaturedSeries from '../../components/FeaturedSeries.jsx';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';
import FeaturedCertifications from '../../components/FeaturedCertifications.jsx';
import HeroGlow from '../../components/HeroGlow.jsx';
import HomeRecentSection from '../../components/HomeRecentSection.jsx';
import Marquee from '../../components/Marquee.jsx';
import Modal from '../../components/Modal.jsx';
import NewsletterForm from '../../components/NewsletterForm.jsx';
import ProjectCard from '../../components/ProjectCard.jsx';
import PushOptIn from '../../components/PushOptIn.jsx';
import RecentAwardCard from '../../components/RecentAwardCard.jsx';
import RevealOnScroll from '../../components/RevealOnScroll.jsx';
import SectionHeading from '../../components/SectionHeading.jsx';
import { safeHref } from '../../../utils/url.js';

export default class HomePage extends PureComponent {
  render() {
    const {
      profile,
      projects,
      featured,
      latestSeries,
      recentProjects,
      recentArticles,
      recentCertifications,
      recentAwards,
      stats,
      loadAwards,
      selected,
      onSelect,
      onCloseDetail,
    } = this.props;
    const { newsletterStatus, newsletterError, onSubscribe, pushStatus, onEnablePush } =
      this.props;
    const cv = safeHref(profile.cvUrl);
    return (
      <>
        <HeroGlow>
          <div
            className="pf-orb"
            style={{
              width: 520,
              height: 520,
              background: 'var(--pf-lime)',
              right: -120,
              top: 60,
            }}
          />
          <div
            className="pf-orb"
            style={{
              width: 420,
              height: 420,
              background: 'var(--pf-vio)',
              left: -140,
              top: 420,
              animationDelay: '-4s',
            }}
          />
          <header
            className="pf-wrap"
            style={{
              paddingTop: 'clamp(64px,10vw,120px)',
              paddingBottom: 'clamp(48px,8vw,90px)',
            }}
          >
            <div className="pf-row pf-rise" style={{ gap: 12 }}>
              <span className="pf-dot" aria-hidden="true" />
              <span className="pf-mono">
                {profile.availability} · {profile.city}
              </span>
            </div>
            <h1 className="pf-h1 pf-rise pf-d1" style={{ marginTop: 28 }}>
              {profile.name},<br />
              <span className="pf-out">{profile.role}</span>
              <span className="pf-lime">.</span>
            </h1>
            <div
              className="pf-row pf-between pf-rise pf-d2"
              style={{ alignItems: 'flex-end', marginTop: 48, gap: 32 }}
            >
              <p className="pf-lead">{profile.intro}</p>
              <div className="pf-row">
                <Link className="pf-btn pf-btn--pri" to="/projets">
                  Voir mes projets ↗
                </Link>
                {cv ? (
                  <a
                    className="pf-btn"
                    href={cv}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Télécharger le CV
                  </a>
                ) : (
                  <Link className="pf-btn" to="/contact">
                    Me contacter
                  </Link>
                )}
              </div>
            </div>
            <span className="pf-scroll" aria-hidden="true">
              Scroll ↓
            </span>
          </header>
        </HeroGlow>
        <Marquee items={profile.tech} />

        <main>
          <section className="pf-wrap pf-sec" aria-label="Chiffres clés">
            <div className="pf-grid4">
              {[
                [stats.projects, 'Projets'],
                [stats.certifications, 'Certifications'],
                [stats.distinctions, 'Distinctions'],
                [stats.technologies, 'Technologies'],
              ].map(([n, label]) => (
                <div
                  key={label}
                  className="pf-col"
                  style={{
                    gap: 4,
                    borderTop: '1px solid var(--pf-line)',
                    paddingTop: 20,
                  }}
                >
                  <span className="pf-h2" style={{ fontSize: 'clamp(2.6rem,5vw,4rem)' }}>
                    <AnimatedCounter value={n} />
                    <span className="pf-lime">+</span>
                  </span>
                  <span className="pf-mu">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pf-wrap pf-sec" aria-labelledby="home-projects">
            <SectionHeading
              kicker="01 — Sélection"
              title="Projets en vedette"
              id="home-projects"
            >
              <Link className="pf-btn" to="/projets">
                Tous les projets →
              </Link>
            </SectionHeading>
            <div className="pf-grid3">
              {projects.map((p, i) => (
                <RevealOnScroll key={p.slug}>
                  <ProjectCard project={p} height={i === 0 ? 240 : 220} />
                </RevealOnScroll>
              ))}
            </div>
          </section>

          <ErrorBoundary>
            <HomeRecentSection
              id="home-recent-projects"
              kicker="Atelier"
              title="Sorti de l’atelier"
              to="/projets"
              linkLabel="Tous les projets"
              count={recentProjects.length}
            >
              {recentProjects.map((p) => (
                <RevealOnScroll key={p.slug}>
                  <ProjectCard project={p} height={220} />
                </RevealOnScroll>
              ))}
            </HomeRecentSection>
          </ErrorBoundary>

          <ErrorBoundary>
            <HomeRecentSection
              id="home-recent-articles"
              kicker="Blog"
              title="Fraîchement écrit"
              to="/blog"
              linkLabel="Tous les articles"
              count={recentArticles.length}
            >
              {recentArticles.map((card) => (
                <RevealOnScroll key={card.id}>
                  <ArticleCard card={card} />
                </RevealOnScroll>
              ))}
            </HomeRecentSection>
          </ErrorBoundary>

          <ErrorBoundary>
            <FeaturedSeries items={latestSeries} />
          </ErrorBoundary>

          <section className="pf-wrap pf-sec">
            <ErrorBoundary>
              <FeaturedCertifications items={featured} onOpen={onSelect} />
            </ErrorBoundary>
            <ErrorBoundary>
              {loadAwards ? <AwardsSummary load={loadAwards} /> : null}
            </ErrorBoundary>
          </section>

          <ErrorBoundary>
            <HomeRecentSection
              id="home-recent-certifications"
              kicker="Preuves"
              title="Derniers acquis"
              to="/certifications"
              linkLabel="Toutes les certifications"
              count={recentCertifications.length}
            >
              {recentCertifications.map((c) => (
                <CertificationCard key={c.id} certification={c} onOpen={onSelect} />
              ))}
            </HomeRecentSection>
          </ErrorBoundary>

          <ErrorBoundary>
            <HomeRecentSection
              id="home-recent-awards"
              kicker="Reconnaissance"
              title="Dernières distinctions"
              to="/distinctions"
              linkLabel="Toutes les distinctions"
              count={recentAwards.length}
            >
              {recentAwards.map((a) => (
                <RecentAwardCard key={a.id} award={a} />
              ))}
            </HomeRecentSection>
          </ErrorBoundary>

          <section className="pf-wrap pf-sec" aria-labelledby="newsletter-title">
            <div
              className="pf-card pf-split"
              style={{
                padding: 'clamp(28px,5vw,64px)',
                display: 'grid',
                gridTemplateColumns: '7fr 5fr',
                gap: 48,
                alignItems: 'center',
              }}
            >
              <div className="pf-col">
                <span className="pf-kicker">Newsletter</span>
                <h2 id="newsletter-title" className="pf-h2">
                  Recevoir mes nouvelles publications
                </h2>
                <p className="pf-mu" style={{ margin: 0 }}>
                  Articles, formations, projets, certifications et distinctions : un
                  courriel à chaque nouveauté.
                </p>
                <ErrorBoundary>
                  <NewsletterForm
                    status={newsletterStatus}
                    error={newsletterError}
                    onSubmit={onSubscribe}
                  />
                </ErrorBoundary>
              </div>
              <div className="pf-col">
                <h2 className="pf-h3">Notifications</h2>
                <PushOptIn status={pushStatus} onEnable={onEnablePush} />
              </div>
            </div>
          </section>
        </main>

        {selected ? (
          <Modal title={selected.title} onClose={onCloseDetail}>
            <CertificationDetail certification={selected} />
          </Modal>
        ) : null}
      </>
    );
  }
}
HomePage.defaultProps = {
  featured: [],
  projects: [],
  recentProjects: [],
  recentArticles: [],
  recentCertifications: [],
  recentAwards: [],
  stats: { projects: 0, certifications: 0, distinctions: 0, technologies: 0 },
  newsletterStatus: 'idle',
  pushStatus: 'idle',
};

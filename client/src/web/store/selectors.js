import { createSelector } from '@reduxjs/toolkit';
import CertificationService from '../../bll/services/CertificationService.js';
import AwardService from '../../bll/services/AwardService.js';
import ContentService from '../../bll/services/ContentService.js';
import AdminContentService from '../../bll/services/AdminContentService.js';
import ArticleService from '../../bll/services/ArticleService.js';
import RecentService from '../../bll/services/RecentService.js';

const certItems = (s) => s.certifications.items;
const certFilters = (s) => s.certifications.filters;

export const selectVisibleCertifications = createSelector(
  [certItems, certFilters],
  (items, filters) => CertificationService.filterAndSort(items, filters)
);
export const selectCertificationFacets = createSelector([certItems], (items) =>
  CertificationService.facets(items)
);
export const selectFeaturedCertifications = createSelector([certItems], (items) =>
  CertificationService.featured(items)
);

const awardItems = (s) => s.awards.items;
const awardType = (s) => s.awards.activeType;

export const selectVisibleAwards = createSelector(
  [awardItems, awardType],
  (items, type) => AwardService.filterByType(items, type)
);
/** Totaux de la sélection affichée (onglet actif) : calculés dans la BLL. */
export const selectVisibleAwardTotals = createSelector([selectVisibleAwards], (items) =>
  AwardService.computeTotals(items)
);
export const selectAwardGroups = createSelector([selectVisibleAwards], (items) =>
  AwardService.groupByYear(items)
);

const projects = (s) => s.content.projects;
const projectFilters = (s) => s.content.filters;
export const selectVisibleProjects = createSelector(
  [projects, projectFilters],
  (list, f) => ContentService.filterProjects(list, f)
);
export const selectProjectCategories = createSelector([projects], (list) =>
  ContentService.categories(list)
);
/** Projets marqués « en vedette » dans l'admin, sinon les premiers de la liste. */
export const selectFeaturedProjects = createSelector([projects], (list) => {
  const featured = list.filter((p) => p.featured);
  return (featured.length ? featured : list).slice(0, 3);
});

// --- Accueil : contenus ajoutés récemment, sans répéter ceux déjà en vedette ---
export const selectRecentProjects = createSelector(
  [projects, selectFeaturedProjects],
  (list, featured) => RecentService.latest(list, { exclude: featured })
);
export const selectRecentCertifications = createSelector(
  [certItems, selectFeaturedCertifications],
  (items, featured) =>
    RecentService.latest(items, {
      exclude: featured,
      date: (c) => c.createdAt || c.issueDate,
    })
);
export const selectRecentAwards = createSelector([awardItems], (items) =>
  RecentService.latest(items, { date: (a) => a.createdAt || a.awardedAt })
);
const latestArticles = (s) => s.articles.latest;
export const selectRecentArticleCards = createSelector([latestArticles], (items) =>
  items.map((a, i) => ArticleService.toCard(a, i))
);

const modComments = (s) => s.moderation.comments;
const modMessages = (s) => s.moderation.messages;
/** Pastilles de la barre latérale admin (commentaires à modérer, messages non lus). */
export const selectAdminBadges = createSelector(
  [modComments, modMessages],
  (comments, messages) => AdminContentService.badges({ comments, messages })
);

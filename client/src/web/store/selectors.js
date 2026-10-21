import { createSelector } from '@reduxjs/toolkit';
import CertificationService from '../../bll/services/CertificationService.js';
import AwardService from '../../bll/services/AwardService.js';

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

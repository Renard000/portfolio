import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchSeries } from '../store/slices/videosSlice.js';
import { loadSeriesProgress } from '../store/slices/progressSlice.js';
import SeriesPage from '../views/pages/client/SeriesPage.jsx';

class SeriesController extends Component {
  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prev) {
    if (prev.slug !== this.props.slug) this.load();
  }

  async load() {
    try {
      const series = await this.props.fetchSeries(this.props.slug).unwrap();
      this.props.loadSeriesProgress(series.videos);
    } catch {
      /* l'erreur est affichée par la vue via le store */
    }
  }

  render() {
    const p = this.props;
    return (
      <SeriesPage
        series={p.series}
        loading={p.loading}
        error={p.error}
        progress={p.progress}
      />
    );
  }
}

const mapState = (s, own) => ({
  slug: own.match.params.seriesSlug,
  series: s.videos.series.data,
  loading: s.videos.series.loading,
  error: s.videos.series.error,
  progress: s.progress.series,
});
export default connect(mapState, { fetchSeries, loadSeriesProgress })(SeriesController);

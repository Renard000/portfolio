import { Component } from 'react';

/**
 * Render prop : appelle load() au montage puis rend children({ data, loading, error }).
 * Ignore la réponse si le composant a été démonté entre-temps.
 */
export default class DataFetcher extends Component {
  state = { data: null, loading: true, error: null };
  mounted = false;

  componentDidMount() {
    this.mounted = true;
    this.run();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  run = async () => {
    this.setState({ loading: true, error: null });
    try {
      const data = await this.props.load();
      if (this.mounted) this.setState({ data, loading: false });
    } catch (err) {
      if (this.mounted) this.setState({ error: err.message || 'Erreur', loading: false });
    }
  };

  render() {
    return this.props.children({ ...this.state, retry: this.run });
  }
}

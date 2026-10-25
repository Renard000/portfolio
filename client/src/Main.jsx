import ReactDOM from 'react-dom';
import { App } from './web/App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/jetbrains-mono';
import './style.css';
import './web/styles/theme.css';

const root = document.getElementById('root');
ReactDOM.render(<App />, root);

import { config } from './shared/config.js';
import { buildContainer } from './web/compositionRoot.js';
import { createApp } from './web/app.js';

const container = buildContainer(config);
const app = createApp(container, config);

app.listen(config.port, () => console.log('API sur le port ' + config.port));

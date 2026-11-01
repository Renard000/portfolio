// Point d'entrée Vercel : l'application Express sert de fonction, sans app.listen.
import { config } from '../src/shared/config.js';
import { buildContainer } from '../src/web/compositionRoot.js';
import { createApp } from '../src/web/app.js';

export default createApp(buildContainer(config), config);

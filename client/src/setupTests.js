import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Pages en chargement différé : la première ouverture peut dépasser le délai par défaut (1 s)
configure({ asyncUtilTimeout: 4000 });

// Valeurs factices : aucun test ne doit avoir besoin de vraies clés.
process.env.APP_API_URL = 'http://localhost:4000/api';
process.env.APP_SUPABASE_URL = 'http://localhost:54321';
process.env.APP_SUPABASE_ANON_KEY = 'anon-test-key';

// jsdom n'implémente pas window.scrollTo
window.scrollTo = () => {};

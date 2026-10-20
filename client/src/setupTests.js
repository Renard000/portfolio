import '@testing-library/jest-dom';

// Valeurs factices : aucun test ne doit avoir besoin de vraies clés.
process.env.APP_API_URL = 'http://localhost:4000/api';
process.env.APP_SUPABASE_URL = 'http://localhost:54321';
process.env.APP_SUPABASE_ANON_KEY = 'anon-test-key';

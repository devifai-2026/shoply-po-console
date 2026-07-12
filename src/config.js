// ─── Environment-based configuration ─────────────────────────────────────────
// Set VITE_API_URL in .env (development) / .env.production (production build).

export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_URL = `${SERVER_URL}/api/platform`;

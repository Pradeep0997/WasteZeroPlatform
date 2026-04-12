/**
 * DEPRECATED: This file (src/api.js) is NOT the active API module.
 * All API calls should use `src/services/api.js` which is the canonical
 * API module used throughout the application.
 *
 * This file re-exports everything from services/api.js to avoid conflicts
 * if it is accidentally imported.
 */
export { default, adminAPI, pickupAPI, legacyAdminAPI } from './services/api';

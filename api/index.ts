import serverless from 'serverless-http';

// Import the built Express app
// @ts-ignore - dynamic import from build output
const app = require('../packages/server/dist/packages/server/src/index.js').default;

// Export as Vercel serverless function
export default serverless(app);

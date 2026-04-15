const serverless = require('serverless-http');
const app = require('../../server');
const { connectDB, getIsConnected } = require('../../server/config/db');

// Wrap the app with serverless-http inside the functions base path
const handler = serverless(app, {
  basePath: '/.netlify/functions'
});

module.exports.handler = async (event, context) => {
  // Make sure to not keep the process waiting for the event loop
  context.callbackWaitsForEmptyEventLoop = false;

  // On cold start, ensure MongoDB connects
  if (!getIsConnected()) {
    console.log('Serverless cold start: Connecting to MongoDB...');
    await connectDB();
  }

  // Pass request down to Express
  return await handler(event, context);
};

const express = require('express');
const { DeleteJobStore } = require('./lib/deleteJobStore');
const { createAccountDeleteRouter } = require('./routes/accountDelete');
const { sendEmail } = require('./lib/email');

function createApp(options = {}) {
  const app = express();
  const jobStore = options.jobStore || new DeleteJobStore({ filePath: options.storePath });
  const secret = options.secret || process.env.DELETE_TOKEN_SECRET;
  const publicBaseUrl = options.publicBaseUrl || process.env.PUBLIC_BASE_URL || 'https://resetdopa.com';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Lightweight demo auth hook.
  // In production, plug in your existing session middleware and populate req.user.
  app.use((req, _res, next) => {
    if (!req.user && req.headers['x-user-id']) {
      req.user = {
        id: req.headers['x-user-id'],
        email: req.headers['x-user-email'] || null,
      };
    }
    next();
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use('/api', createAccountDeleteRouter({
    jobStore,
    secret,
    publicBaseUrl,
    sendEmail: options.sendEmail || sendEmail,
  }));

  return app;
}

module.exports = {
  createApp,
};

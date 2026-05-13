const express = require('express');
const rateLimit = require('express-rate-limit');
const { createDeletionToken, verifyDeletionToken } = require('../lib/token');
const { processDeletionJob } = require('../workers/deleteWorker');

function getRequestUser(req) {
  if (req.user && req.user.id) {
    return {
      id: req.user.id,
      email: req.user.email || req.headers['x-user-email'] || null,
    };
  }

  if (req.session && req.session.user && req.session.user.id) {
    return {
      id: req.session.user.id,
      email: req.session.user.email || null,
    };
  }

  if (req.headers['x-user-id']) {
    return {
      id: req.headers['x-user-id'],
      email: req.headers['x-user-email'] || null,
    };
  }

  return null;
}

function requireSessionAuth(req, res, next) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = user;
  next();
}

function requireCsrfIfConfigured(req, res, next) {
  const expected = process.env.DELETE_CSRF_TOKEN;
  if (!expected) {
    return next();
  }

  const actual = req.get('X-CSRF-Token');
  if (actual !== expected) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  return next();
}

function getRateKey(req) {
  const user = getRequestUser(req);
  return user?.id ? `user:${user.id}` : `ip:${req.ip}`;
}

function createRateLimiter() {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateKey,
    message: { error: 'Too many deletion requests. Try again later.' },
  });
}

function getConfirmUrl(publicBaseUrl, token) {
  const base = (publicBaseUrl || 'https://resetdopa.com').replace(/\/$/, '');
  return `${base}/account/delete/confirm/?token=${encodeURIComponent(token)}`;
}

function createAccountDeleteRouter(options) {
  const router = express.Router();
  const jobStore = options.jobStore;
  const sendEmail = options.sendEmail;
  const secret = options.secret || process.env.DELETE_TOKEN_SECRET;
  const publicBaseUrl = options.publicBaseUrl || process.env.PUBLIC_BASE_URL || 'https://resetdopa.com';
  const requestLimiter = createRateLimiter();

  if (!jobStore) {
    throw new Error('jobStore is required');
  }

  router.post('/account/delete-request', requestLimiter, requireSessionAuth, requireCsrfIfConfigured, async (req, res) => {
    try {
      if (!secret) {
        return res.status(500).json({ error: 'DELETE_TOKEN_SECRET is not configured' });
      }

      const reauthRequired = String(process.env.REQUIRE_REAUTH_FOR_DELETE || '').toLowerCase() === 'true';
      const reauthVerified = req.body?.reauthVerified === true || req.get('X-Reauth-Verified') === 'true';
      if (reauthRequired && !reauthVerified) {
        return res.status(428).json({ error: 'Recent re-authentication required' });
      }

      const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
      const user = req.user;
      const job = await jobStore.createJob({
        uid: user.id,
        email: user.email || null,
        reason,
        tokenJti: null,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      });

      const confirmedToken = createDeletionToken({
        uid: user.id,
        jobId: job.jobId,
        email: user.email || null,
      }, secret, process.env.DELETE_TOKEN_TTL || '6h');

      await jobStore.updateJob(job.jobId, {
        tokenJti: confirmedToken.jti,
        deletionTokenIssuedAt: new Date().toISOString(),
        confirmUrl: getConfirmUrl(publicBaseUrl, confirmedToken.token),
      });

      await sendEmail({
        to: user.email,
        subject: 'Confirm your ResetDopa account deletion',
        text: [
          'You requested account deletion for ResetDopa.',
          `Reference ID: ${job.referenceId}`,
          `Confirm here: ${getConfirmUrl(publicBaseUrl, confirmedToken.token)}`,
          'This one-time confirmation link expires in 6 hours.',
          'If you did not make this request, ignore this email.',
        ].join('\n\n'),
        html: `
          <p>You requested account deletion for ResetDopa.</p>
          <p><strong>Reference ID:</strong> ${job.referenceId}</p>
          <p><a href="${getConfirmUrl(publicBaseUrl, confirmedToken.token)}">Confirm account deletion</a></p>
          <p>This one-time confirmation link expires in 6 hours.</p>
          <p>If you did not make this request, ignore this email.</p>
        `,
      });

      return res.status(202).json({
        jobId: job.jobId,
        referenceId: job.referenceId,
        status: job.status,
      });
    } catch (error) {
      console.error('[account-delete] request failed', error);
      return res.status(500).json({ error: error.message || 'Unable to request deletion' });
    }
  });

  router.post('/account/delete-confirm', requestLimiter, async (req, res) => {
    try {
      if (!secret) {
        return res.status(500).json({ error: 'DELETE_TOKEN_SECRET is not configured' });
      }

      const token = req.body?.token || req.query?.token;
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const payload = verifyDeletionToken(token, secret);
      const job = await jobStore.findJobById(payload.jobId);
      if (!job) {
        return res.status(404).json({ error: 'Deletion job not found' });
      }

      if (job.tokenJti !== payload.jti) {
        return res.status(409).json({ error: 'Token has already been used or does not match this job' });
      }

      if (job.tokenUsed && job.status === 'completed') {
        return res.status(200).json({
          referenceId: job.referenceId,
          status: job.status,
        });
      }

      await jobStore.markTokenUsed(job.jobId, payload.jti);
      await jobStore.updateJob(job.jobId, {
        status: 'scheduled',
        scheduledAt: new Date().toISOString(),
      });
      await jobStore.appendAudit(job.jobId, 'deletion-confirmed', { by: 'email-token' });

      // In production this should enqueue a background worker.
      // The example runs synchronously so tests can verify the lifecycle.
      const completed = await processDeletionJob({
        jobStore,
        sendEmail,
        jobId: job.jobId,
      });

      return res.status(200).json({
        referenceId: completed.referenceId,
        status: completed.status,
      });
    } catch (error) {
      console.error('[account-delete] confirm failed', error);
      const statusCode = error.code === 'jwt expired' ? 410 : 400;
      return res.status(statusCode).json({ error: error.message || 'Unable to confirm deletion' });
    }
  });

  router.get('/account/delete-status', async (req, res) => {
    try {
      const jobId = req.query.jobId;
      if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
      }

      const job = await jobStore.findJobById(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Deletion job not found' });
      }

      return res.status(200).json({
        jobId: job.jobId,
        referenceId: job.referenceId,
        status: job.status,
        scheduledAt: job.scheduledAt || null,
        completedAt: job.completedAt || null,
      });
    } catch (error) {
      console.error('[account-delete] status failed', error);
      return res.status(500).json({ error: error.message || 'Unable to fetch deletion status' });
    }
  });

  return router;
}

module.exports = {
  createAccountDeleteRouter,
  requireSessionAuth,
};

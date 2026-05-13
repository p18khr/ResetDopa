const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function createDeletionToken({ uid, jobId, email }, secret, expiresIn = '6h') {
  if (!secret) {
    throw new Error('DELETE_TOKEN_SECRET is required');
  }

  const jti = crypto.randomUUID();
  const token = jwt.sign(
    {
      uid,
      jobId,
      email,
      purpose: 'account-delete',
    },
    secret,
    {
      jwtid: jti,
      expiresIn,
      issuer: 'resetdopa',
      audience: 'account-deletion',
    }
  );

  return {
    token,
    jti,
  };
}

function verifyDeletionToken(token, secret) {
  if (!secret) {
    throw new Error('DELETE_TOKEN_SECRET is required');
  }

  const payload = jwt.verify(token, secret, {
    issuer: 'resetdopa',
    audience: 'account-deletion',
  });

  if (payload.purpose !== 'account-delete') {
    const error = new Error('Invalid deletion token purpose');
    error.code = 'invalid-purpose';
    throw error;
  }

  return payload;
}

module.exports = {
  createDeletionToken,
  verifyDeletionToken,
};

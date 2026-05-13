const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../server/app');
const { DeleteJobStore } = require('../server/lib/deleteJobStore');

function createTempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resetdopa-delete-'));
  return new DeleteJobStore({ filePath: path.join(dir, 'jobs.json') });
}

function makeMailerMock() {
  const calls = [];
  const sendEmail = jest.fn(async (message) => {
    calls.push(message);
    return { messageId: `mock-${calls.length}` };
  });

  return { sendEmail, calls };
}

describe('account deletion flow', () => {
  beforeEach(() => {
    process.env.DELETE_TOKEN_SECRET = 'test-secret';
    delete process.env.DELETE_CSRF_TOKEN;
    delete process.env.REQUIRE_REAUTH_FOR_DELETE;
  });

  it('creates a deletion job, sends a confirmation email, and completes after confirmation', async () => {
    const jobStore = createTempStore();
    const mailer = makeMailerMock();
    const app = createApp({
      jobStore,
      sendEmail: mailer.sendEmail,
      secret: 'test-secret',
      publicBaseUrl: 'https://resetdopa.com',
    });

    const requestResponse = await request(app)
      .post('/api/account/delete-request')
      .set('x-user-id', 'user-123')
      .set('x-user-email', 'user@example.com')
      .send({ reason: 'testing' })
      .expect(202);

    expect(requestResponse.body.jobId).toBeTruthy();
    expect(requestResponse.body.referenceId).toMatch(/^RD-/);
    expect(mailer.sendEmail).toHaveBeenCalledTimes(1);

    const emailBody = mailer.calls[0].text;
    const tokenMatch = emailBody.match(/token=([^\s]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = decodeURIComponent(tokenMatch[1]);

    const confirmResponse = await request(app)
      .post('/api/account/delete-confirm')
      .send({ token })
      .expect(200);

    expect(confirmResponse.body.referenceId).toBe(requestResponse.body.referenceId);
    expect(confirmResponse.body.status).toBe('completed');

    const statusResponse = await request(app)
      .get('/api/account/delete-status')
      .query({ jobId: requestResponse.body.jobId })
      .expect(200);

    expect(statusResponse.body.status).toBe('completed');
    expect(statusResponse.body.referenceId).toBe(requestResponse.body.referenceId);
    expect(mailer.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('requires authentication for the deletion request', async () => {
    const jobStore = createTempStore();
    const mailer = makeMailerMock();
    const app = createApp({
      jobStore,
      sendEmail: mailer.sendEmail,
      secret: 'test-secret',
    });

    await request(app)
      .post('/api/account/delete-request')
      .send({ reason: 'no auth' })
      .expect(401);
  });
});

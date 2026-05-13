const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

class DeleteJobStore {
  constructor(options = {}) {
    this.filePath = options.filePath || process.env.DELETE_JOB_STORE_PATH || path.join(__dirname, '..', 'data', 'delete-jobs.json');
    this.state = { jobs: {}, tokenIndex: {} };
    this._ready = null;
  }

  async init() {
    if (!this._ready) {
      this._ready = this._load();
    }
    return this._ready;
  }

  async _load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.state = {
        jobs: parsed.jobs || {},
        tokenIndex: parsed.tokenIndex || {},
      };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      await this._persist();
    }
  }

  async _persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  _clone(value) {
    return value ? JSON.parse(JSON.stringify(value)) : null;
  }

  async createJob({ uid, email, reason, tokenJti, expiresAt }) {
    await this.init();
    const jobId = crypto.randomUUID();
    const referenceId = `RD-${jobId.slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const job = {
      jobId,
      referenceId,
      uid,
      email,
      reason: reason || '',
      tokenJti: tokenJti || null,
      tokenUsed: false,
      status: 'pending',
      requestedAt: now,
      updatedAt: now,
      expiresAt: expiresAt || null,
      scheduledAt: null,
      completedAt: null,
      audit: [
        {
          action: 'request-created',
          timestamp: now,
        },
      ],
    };

    this.state.jobs[jobId] = job;
    if (tokenJti) {
      this.state.tokenIndex[tokenJti] = jobId;
    }
    await this._persist();
    return this._clone(job);
  }

  async findJobById(jobId) {
    await this.init();
    return this._clone(this.state.jobs[jobId]);
  }

  async findJobByTokenJti(tokenJti) {
    await this.init();
    const jobId = this.state.tokenIndex[tokenJti];
    return jobId ? this.findJobById(jobId) : null;
  }

  async updateJob(jobId, patch) {
    await this.init();
    const job = this.state.jobs[jobId];
    if (!job) {
      return null;
    }

    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    await this._persist();
    return this._clone(job);
  }

  async appendAudit(jobId, action, metadata = {}) {
    await this.init();
    const job = this.state.jobs[jobId];
    if (!job) {
      return null;
    }

    job.audit = job.audit || [];
    job.audit.push({
      action,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
    job.updatedAt = new Date().toISOString();
    await this._persist();
    return this._clone(job);
  }

  async markTokenUsed(jobId, tokenJti) {
    await this.init();
    const job = this.state.jobs[jobId];
    if (!job) {
      return null;
    }

    if (job.tokenJti !== tokenJti) {
      const error = new Error('Token does not match this job');
      error.code = 'token-mismatch';
      throw error;
    }

    if (job.tokenUsed) {
      return this._clone(job);
    }

    job.tokenUsed = true;
    job.tokenUsedAt = new Date().toISOString();
    job.updatedAt = job.tokenUsedAt;
    job.audit = job.audit || [];
    job.audit.push({ action: 'token-used', timestamp: job.tokenUsedAt });
    await this._persist();
    return this._clone(job);
  }

  async listJobs() {
    await this.init();
    return Object.values(this.state.jobs).map((job) => this._clone(job));
  }
}

module.exports = {
  DeleteJobStore,
};

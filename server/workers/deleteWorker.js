async function processDeletionJob({ jobStore, sendEmail, jobId }) {
  const job = await jobStore.findJobById(jobId);
  if (!job) {
    const error = new Error('Deletion job not found');
    error.code = 'job-not-found';
    throw error;
  }

  if (job.status === 'completed') {
    return job;
  }

  await jobStore.updateJob(jobId, {
    status: 'processing',
  });
  await jobStore.appendAudit(jobId, 'worker-started');

  // TODO: integrate the real database cleanup here.
  // Suggested steps:
  // - delete or anonymize Firestore user document
  // - revoke auth/session tokens
  // - remove queued notifications and local push tokens
  // - purge any app-specific backups after the retention window

  const completedJob = await jobStore.updateJob(jobId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
  await jobStore.appendAudit(jobId, 'worker-completed');

  if (sendEmail && job.email) {
    await sendEmail({
      to: job.email,
      subject: 'Your ResetDopa account has been deleted',
      text: [
        'Your account deletion has been completed.',
        `Reference ID: ${job.referenceId}`,
        'If you did not request this change, contact privacy@resetdopa.com immediately.',
      ].join('\n\n'),
      html: `
        <p>Your account deletion has been completed.</p>
        <p><strong>Reference ID:</strong> ${job.referenceId}</p>
        <p>If you did not request this change, contact <a href="mailto:privacy@resetdopa.com">privacy@resetdopa.com</a> immediately.</p>
      `,
    });
  }

  return completedJob;
}

module.exports = {
  processDeletionJob,
};

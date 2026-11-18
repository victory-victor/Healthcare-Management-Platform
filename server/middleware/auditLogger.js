const dbAdapter = require('../services/dbAdapter');

const logAudit = async (req, action, resource, resourceId = null, details = {}, status = 'SUCCESS') => {
  try {
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
    const userAgent = req.headers ? (req.headers['user-agent'] || 'Unknown') : 'Unknown';
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userEmail = req.user ? req.user.email : (req.body ? req.body.email : '');

    await dbAdapter.create('AuditLog', {
      user: userId,
      userEmail,
      action,
      resource,
      resourceId,
      status,
      details,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('[Audit Logger Error]', error.message);
  }
};

module.exports = {
  logAudit
};

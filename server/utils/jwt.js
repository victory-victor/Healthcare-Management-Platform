const jwt = require('jsonwebtoken');

const getSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'medai_nexus_jwt_access_secret_key_1234567890';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'medai_nexus_jwt_refresh_secret_key_9876543210';
  return { accessSecret, refreshSecret };
};

const generateAccessToken = (user) => {
  const { accessSecret } = getSecrets();
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    accessSecret,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );
};

const generateRefreshToken = (user) => {
  const { refreshSecret } = getSecrets();
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email
    },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const verifyAccessToken = (token) => {
  const { accessSecret } = getSecrets();
  return jwt.verify(token, accessSecret);
};

const verifyRefreshToken = (token) => {
  const { refreshSecret } = getSecrets();
  return jwt.verify(token, refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

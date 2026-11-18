const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dbAdapter = require('../services/dbAdapter');
const { connectDB, isConnected } = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logAudit } = require('../middleware/auditLogger');

// Cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// @desc    Register a new user (Patient, Doctor, or Admin)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'patient', phone = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!isConnected()) {
      await connectDB();
    }

    if (!isConnected()) {
      return res.status(503).json({ success: false, message: 'Account registration is unavailable because the database is not connected.' });
    }

    const existingUser = await dbAdapter.findOne('User', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await dbAdapter.create('User', {
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      phone,
      isEmailVerified: true
    });

    // Create corresponding profile
    if (role === 'patient') {
      await dbAdapter.create('PatientProfile', {
        user: newUser._id || newUser.id,
        heightCm: 170,
        weightKg: 68,
        dietaryPreference: 'non-vegetarian',
        healthGoals: ['General healthy eating']
      });
    } else if (role === 'doctor') {
      await dbAdapter.create('DoctorProfile', {
        user: newUser._id || newUser.id,
        fullName: `Dr. ${name}`,
        specialty: req.body.specialty || 'General Physician',
        qualifications: req.body.qualifications || 'MBBS, MD',
        experienceYears: req.body.experienceYears || 5,
        registrationNumber: `REG-${Math.floor(10000 + Math.random() * 90000)}`,
        hospital: req.body.hospital || 'Metro Health Medical Center',
        consultationFees: req.body.consultationFees || 50,
        isVerified: true
      });
    }

    // Default privacy consents
    await dbAdapter.create('ConsentRecord', {
      user: newUser._id || newUser.id,
      consentType: 'medical_data_processing',
      isGranted: true
    });
    await dbAdapter.create('ConsentRecord', {
      user: newUser._id || newUser.id,
      consentType: 'ai_analysis',
      isGranted: true
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Save session
    await dbAdapter.create('UserSession', {
      user: newUser._id || newUser.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip || '127.0.0.1'
    });

    res.cookie('accessToken', accessToken, getCookieOptions());
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    logAudit(req, 'USER_REGISTERED', 'User', newUser._id || newUser.id, { role: newUser.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token: accessToken,
      refreshToken,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await dbAdapter.findOne('User', { email: normalizedEmail }, '+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Auto-heal: If password was somehow not stored or empty in DB, initialize it with current password
    if (!user.password || typeof user.password !== 'string') {
      const salt = await bcrypt.genSalt(10);
      const healedPassword = await bcrypt.hash(password, salt);
      await dbAdapter.findByIdAndUpdate('User', user._id || user.id, { password: healedPassword });
      user.password = healedPassword;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logAudit(req, 'LOGIN_FAILED', 'User', user._id || user.id, { reason: 'Password mismatch' }, 'FAILURE');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await dbAdapter.create('UserSession', {
      user: user._id || user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip || '127.0.0.1'
    });

    res.cookie('accessToken', accessToken, getCookieOptions());
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    logAudit(req, 'LOGIN_SUCCESS', 'User', user._id || user.id, { role: user.role });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookies
// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const session = await dbAdapter.findOne('UserSession', { refreshToken: token });
      if (session) {
        await dbAdapter.findByIdAndDelete('UserSession', session._id || session.id);
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    if (req.user) {
      logAudit(req, 'LOGOUT', 'User', req.user._id || req.user.id);
    }

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await dbAdapter.findById('User', decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie('accessToken', newAccessToken, getCookieOptions());
    res.cookie('refreshToken', newRefreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await dbAdapter.findById('User', req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await dbAdapter.findOne('PatientProfile', { user: user._id || user.id });
    } else if (user.role === 'doctor') {
      profile = await dbAdapter.findOne('DoctorProfile', { user: user._id || user.id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Direct Password Reset (No OTP required)
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await dbAdapter.findOne('User', { email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email address.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await dbAdapter.findByIdAndUpdate('User', user._id || user.id, {
      password: hashedPassword
    });

    logAudit(req, 'PASSWORD_RESET_SUCCESS', 'User', user._id || user.id);
    res.status(200).json({ success: true, message: 'Password has been successfully updated. You may now log in.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Check Account Existence for Password Reset
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await dbAdapter.findOne('User', { email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email address.' });
    }

    res.status(200).json({
      success: true,
      message: 'Account verified. You can now set your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated medical data (Patient or Doctor)
// @route   DELETE /api/auth/account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { purgeUserData } = require('../services/accountDeletionService');

    logAudit(req, 'ACCOUNT_PURGE_REQUESTED', 'User', userId, {}, 'SUCCESS');

    const metrics = await purgeUserData(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Your account and all associated medical records have been permanently erased.',
      details: metrics
    });
  } catch (error) {
    next(error);
  }
};

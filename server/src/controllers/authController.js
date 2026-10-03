import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  address: user.address,
  token: generateToken(user._id),
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(userResponse(user));
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json(userResponse(user));
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  if (name) req.user.name = name;
  if (address) req.user.address = address;
  const saved = await req.user.save();
  res.json(saved);
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400);
    throw new Error('Email is required');
  }

  const genericMessage = 'If an account exists, a password reset link has been sent to your email.';
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Never reveal whether an email exists in the response
    return res.status(200).json({ message: genericMessage });
  }

  // Generate cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = expiry;
  user.resetPasswordExpires = expiry;
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  console.log(`[ShopSphere] Password reset link for ${user.email}: ${resetUrl}`);

  const subject = 'ShopSphere - Password Reset Request';
  const text = `You requested a password reset for your ShopSphere account.\n\nPlease visit the following link to reset your password (link expires in 15 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4ee; border-radius: 10px; background-color: #ffffff;">
      <h2 style="color: #5b3cc4; margin-top: 0;">ShopSphere</h2>
      <h3 style="color: #1c1c28; margin-bottom: 12px;">Password Reset Request</h3>
      <p style="color: #1c1c28; font-size: 15px; line-height: 1.5;">You recently requested to reset your password for your ShopSphere account. Click the button below to proceed:</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #5b3cc4; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #6b6b80; font-size: 14px; margin-bottom: 8px;">This link will expire in <strong>15 minutes</strong> and can only be used once.</p>
      <p style="color: #6b6b80; font-size: 14px; margin-top: 0;">If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e4e4ee; margin: 20px 0;" />
      <p style="color: #888888; font-size: 12px; line-height: 1.4; word-break: break-all;">If you're having trouble clicking the button, copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #5b3cc4;">${resetUrl}</a></p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });
    res.status(200).json({ message: genericMessage });
  } catch (err) {
    console.error('Email send error:', err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent. Please try again later.');
  }
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) {
    res.status(400);
    throw new Error('Reset token is required');
  }

  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    $or: [
      { resetPasswordExpire: { $gt: Date.now() } },
      { resetPasswordExpires: { $gt: Date.now() } }
    ]
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Update password (pre-save hook will hash it with bcrypt)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    message: 'Password has been reset successfully',
    ...userResponse(user)
  });
});

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

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    res.status(400);
    throw new Error('Please enter a valid email address');
  }

  const user = await User.findOne({ email: normalizedEmail });

  // Security requirement: Never reveal whether an email exists in the response
  if (!user) {
    return res.status(200).json({
      message: 'If an account exists with this email, a password reset link and verification code have been sent.',
      email: normalizedEmail,
    });
  }

  // Generate cryptographically secure 4-digit numeric OTP
  const otp = crypto.randomInt(1000, 10000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  // Also generate token for direct email link
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes as per issue spec

  user.resetPasswordOtp = hashedOtp;
  user.resetPasswordOtpExpire = expiry;
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = expiry;
  user.resetPasswordExpires = expiry;
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  console.log(`[ShopSphere Reset Link] ${resetUrl}`);

  const subject = `ShopSphere Admin AI: Your 4-Digit Reset Code is ${otp}`;
  const text = `Hello ${user.name},\n\nYour ShopSphere password reset 4-digit code is: ${otp}\n\nThis verification code was generated and dispatched by the ShopSphere Admin AI Agent (admin@shopsphere.dev).\n\nValid for 15 minutes.\n\nOr click here to reset password directly:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          🤖 ShopSphere Admin AI Agent
        </span>
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">ShopSphere</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Official Dispatch from <strong>admin@shopsphere.dev</strong></p>
      </div>
      <p style="color: #0f172a; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">A password reset request was initiated for your account. The ShopSphere Admin AI Agent has generated your 4-digit verification code:</p>
      
      <div style="background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px;">4-Digit Verification Code (OTP)</div>
        <div style="font-size: 42px; font-weight: 800; letter-spacing: 14px; color: #4f46e5; font-family: monospace;">${otp}</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for 15 minutes · Keep this code confidential</div>
      </div>

      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Alternatively, you can click the button below to reset directly:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 11px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password Directly</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; line-height: 1.4; margin: 0;">Automated email dispatched by ShopSphere Admin AI Agent on behalf of admin@shopsphere.dev. If you did not request this, you can safely ignore this message.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.warn(`[ShopSphere] Note: Email delivery could not complete: ${err.message}`);
  }

  res.status(200).json({
    message: 'If an account exists with this email, a password reset link and verification code have been sent.',
    email: user.email,
    emailSent: true,
    cooldownSeconds: 30,
  });
});

// POST /api/auth/reset-password-otp
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400);
    throw new Error('Email is required');
  }

  if (!otp || typeof otp !== 'string' || otp.trim().length !== 4) {
    res.status(400);
    throw new Error('4-digit OTP is required');
  }

  if (!password) {
    res.status(400);
    throw new Error('New password is required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  if (!confirmPassword) {
    res.status(400);
    throw new Error('Please confirm your new password');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match. Please ensure both passwords are the same.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanedOtp = otp.trim();
  const hashedOtp = crypto.createHash('sha256').update(cleanedOtp).digest('hex');

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordOtp: hashedOtp,
    resetPasswordOtpExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP. Please request a new OTP.');
  }

  // Set new password (pre-save hook will hash it)
  user.password = password;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    message: 'Password has been reset successfully',
    ...userResponse(user),
  });
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
    throw new Error('New password is required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  if (!confirmPassword) {
    res.status(400);
    throw new Error('Please confirm your new password');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match. Please ensure both passwords are the same.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    $or: [
      { resetPasswordExpire: { $gt: Date.now() } },
      { resetPasswordExpires: { $gt: Date.now() } },
    ],
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
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  await user.save();

  res.status(200).json({
    message: 'Password has been reset successfully',
    ...userResponse(user),
  });
});

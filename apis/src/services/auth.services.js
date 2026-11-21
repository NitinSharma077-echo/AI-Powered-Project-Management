const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Models/user');
const HttpError = require('../utils/httpError');

// Function to authenticate a user and generate a JWT token

// "Keep me signed in" issues a long-lived token so the browser can restore
// the session on its next visit; otherwise the session lasts one working day.
// Both lifetimes can be overridden from the environment.
const REMEMBER_TTL = process.env.JWT_REMEMBER_EXPIRES_IN || '30d';
const SESSION_TTL = process.env.JWT_EXPIRES_IN || '1d';

const generateToken = (user, remember = false) => {
  return jwt.sign(
    {
      sub: user._id.toString()
    },
    process.env.JWT_SECRET,
    { expiresIn: remember ? REMEMBER_TTL : SESSION_TTL }
  );
};

const registerUser = async ({ name, email, password, remember = true }) => {
  if (!name || !email || !password) {
    throw new HttpError('Name, email, and password are required', 400);
  }
  if (password.length < 6) {
    throw new HttpError('Password must be at least 6 characters long', 400);
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new HttpError('User with this email already exists', 409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name,
    email,
    passwordHash,
    role: 'user'
  });
  const token = generateToken(newUser, Boolean(remember));
  return { user: newUser, token };
};

const loginUser = async ({ email, password, remember = false }) => {
  if (!email || !password) {
    throw new HttpError('Email and password are required', 400);
  }
  const foundUser = await User.findOne({ email }).select('+passwordHash');
  if (!foundUser) {
    throw new HttpError('Invalid email or password', 401);
  }
  const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
  if (!isMatch) {
    throw new HttpError('Invalid email or password', 401);
  }
  const token = generateToken(foundUser, Boolean(remember));
  return { user: foundUser, token };
};

const updateProfile = async (userId, { name }) => {
  if (!name || !name.trim()) {
    throw new HttpError('Name is required', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name: name.trim() },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new HttpError('User not found', 404);
  }

  return updatedUser;
};

module.exports = {
  registerUser,
  loginUser,
  updateProfile
};

const express = require('express');
const { registerUser, loginUser, updateProfile } = require('../services/auth.services');
const { auth } = require('../middlewares/auth');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req, res) => {
  res.status(200).json({ user: req.user });
});

router.patch('/me', auth, async (req, res, next) => {
  try {
    const user = await updateProfile(req.user._id, req.body);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

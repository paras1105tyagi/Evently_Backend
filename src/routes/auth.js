'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const User = require('../models/user.model');
const { hashPassword, comparePassword, signToken } = require('../utils/auth');

const router = Router();

const registerSchema = Joi.object({
	body: Joi.object({
		name: Joi.string().min(2).required(),
		email: Joi.string().email().required(),
		password: Joi.string().min(6).required(),
		role: Joi.string().valid('user', 'admin').default('user')
	})
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
	try {
		const { name, email, password, role } = req.validated.body;
		const exists = await User.findOne({ email });
		if (exists) return res.status(409).json({ error: 'Email already registered' });
		const passwordHash = await hashPassword(password);
		const user = await User.create({ name, email, passwordHash, role });
		res.status(201).json({ id: user._id, email: user.email });
	} catch (err) {
		next(err);
	}
});

const loginSchema = Joi.object({
	body: Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required()
	})
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
	try {
		const { email, password } = req.validated.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok = await comparePassword(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		const token = signToken({ sub: String(user._id), role: user.role, email: user.email });
		res.json({ token });
	} catch (err) {
		next(err);
	}
});

module.exports = router;

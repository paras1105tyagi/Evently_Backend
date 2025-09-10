'use strict';

const { Router } = require('express');
const userRouter = require('./user');
const adminRouter = require('./admin');
const authRouter = require('./auth');
const { auth, requireRole } = require('../middlewares/auth');

const router = Router();

router.use('/auth', authRouter);
router.use('/user', auth(true), userRouter);
router.use('/admin', auth(true), requireRole('admin'), adminRouter);

module.exports = router;

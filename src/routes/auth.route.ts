import { Router } from 'express';
import { register, login, logout, refreshToken, getProfile } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/user', getProfile);

export default router;
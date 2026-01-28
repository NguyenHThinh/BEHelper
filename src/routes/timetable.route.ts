import { Router } from 'express';
import { createEntry, getEntries, deleteEntry } from '../controllers/timetable.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.post('/', createEntry);
router.get('/', getEntries);
router.delete('/:id', deleteEntry);

export default router;

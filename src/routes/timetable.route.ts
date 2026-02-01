import { Router } from 'express';
import { createEntry, getEntries, deleteEntry, updateEntry } from '../controllers/timetable.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.post('/', createEntry);
router.get('/', getEntries);
router.delete('/:id', deleteEntry);
router.put('/:id', updateEntry);

export default router;

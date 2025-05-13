import express from 'express';
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateClearanceProgress
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/create', createGroup);
router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.post('/update-clearance', updateClearanceProgress);

export default router;

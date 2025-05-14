// routes/group.js
import express from 'express';
const router = express.Router();

import {
  getAllGroups,
  getGroupById,
  updateClearanceProgress,
  getGroupByNumber,
  getGroupsByClearanceStatus
  
} from '../controllers/groupController.js';

router.get('/', getAllGroups);                 // List all groups with members
router.get('/:id', getGroupById);             // Get one group by ID
router.post('/update-clearance', updateClearanceProgress);
router.get('/by-number/:groupNumber', getGroupByNumber);
router.get('/status/:type/:status', getGroupsByClearanceStatus); 

export default router;

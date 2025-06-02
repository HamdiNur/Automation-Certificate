import express from 'express';

const router = express.Router();

import {
  getAllGroups,
  getGroupById,
  getGroupByNumber,
  getGroupMembers,
  getGroupsByClearanceStatus,
  getGroupStatusCount, // ✅ added
  updateClearanceStatus
} from '../controllers/groupController.js';

router.get('/', getAllGroups);                 
router.get('/status-count', getGroupStatusCount); // ✅ added
router.get('/by-number/:groupNumber', getGroupByNumber);
router.get('/status/:type/:status', getGroupsByClearanceStatus); 
router.post('/update-clearance', updateClearanceStatus);
router.get('/:groupId/students', getGroupMembers);

router.get('/:id', getGroupById);              // ⚠️ This should stay last

export default router;

import express from 'express';

const router = express.Router();

import {
  getAllGroups,
  getGroupById,
  getGroupByNumber,
  getGroupMembers,
  getGroupMembersByNumber,
  getGroupsByClearanceStatus,
  getGroupStatusCount, // ✅ added
  updateClearanceStatus
} from '../controllers/groupController.js';
import { getLibraryHistory } from '../controllers/libraryController.js';

router.get('/', getAllGroups);                 
router.get('/status-count', getGroupStatusCount); // ✅ added
router.get('/history/:groupId', getLibraryHistory); // 🔥 Add this route

router.get('/by-number/:groupNumber', getGroupByNumber);
router.get('/status/:type/:status', getGroupsByClearanceStatus); 
router.post('/update-clearance', updateClearanceStatus);
router.get('/:groupId/students', getGroupMembers);
router.get('/by-number/:groupNumber/students', getGroupMembersByNumber);


router.get('/:id', getGroupById);              // ⚠️ This should stay last

export default router;

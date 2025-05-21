// 📁 routes/library.js
import express from 'express';
import {
  getAllLibraryClearances,
  getLibraryByGroupId,
  updateLibraryStatus,
  getLibraryByStudentId,
  getPendingLibrary,
  approveLibrary,
  rejectLibrary,
  getLibraryStats

} from '../controllers/libraryController.js';

const router = express.Router();
router.get('/pending', getPendingLibrary);
router.get('/stats', getLibraryStats);
router.post('/approve', approveLibrary);
router.post('/reject', rejectLibrary);
router.get('/student/:studentId', getLibraryByStudentId);
router.get('/:groupId', getLibraryByGroupId); // keep last
router.get('/', getAllLibraryClearances);
router.put('/update', updateLibraryStatus);


export default router;

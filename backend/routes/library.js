// 📁 routes/library.js
import express from 'express';
import {
  getAllLibraryClearances,
  getLibraryStats,
  getLibraryByGroupId,
  updateLibraryStatus,
  getLibraryByStudentId,
  getPendingLibrary,
  approveLibrary,
  rejectLibrary,
  // fixLibraryFlags,
  

} from '../controllers/libraryController.js';

const router = express.Router();
router.get('/pending', getPendingLibrary);
// router.post('/fix-flags', fixLibraryFlags); // 🔧 Manual fixer route

router.post('/approve', approveLibrary);
router.post('/reject', rejectLibrary);
router.get('/stats', getLibraryStats); // ✅ Add this line

router.get('/student/:studentId', getLibraryByStudentId);
router.get('/:groupId', getLibraryByGroupId); // keep last
router.get('/', getAllLibraryClearances);

router.put('/update', updateLibraryStatus);

export default router;

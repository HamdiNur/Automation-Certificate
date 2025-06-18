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
  markLibraryReadyAgain,
  getLibraryHistory,
  getMyGroupLibrary,
  // fixLibraryFlags,
  

} from '../controllers/libraryController.js';
import auth from '../middleware/authMiddleware.js';
import studentAuth from '../middleware/studentAuth.js';

const router = express.Router();
router.get('/pending', getPendingLibrary);
// router.post('/fix-flags', fixLibraryFlags); // 🔧 Manual fixer route

router.post('/approve', approveLibrary);
router.post('/reject',rejectLibrary);
router.get('/stats', getLibraryStats); 
router.get('/my-group', studentAuth, getMyGroupLibrary);

router.get('/history/:groupId', getLibraryHistory); // ✅ Add this line

// ✅ Add this line
router.post('/mark-again', auth, markLibraryReadyAgain);

router.get('/student/:studentId', getLibraryByStudentId);
router.get('/:groupId', getLibraryByGroupId); // keep last
router.get('/', getAllLibraryClearances);

router.put('/update', updateLibraryStatus);

export default router;

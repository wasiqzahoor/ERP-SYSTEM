const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceForUser, getAttendanceByDate ,exportAttendance, getMyAttendanceByDate} = require('../controllers/hrmController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const { uploadAttendanceCSV } = require('../controllers/hrmController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { logAction } = require('../middleware/auditMiddleware');
// Route for marking attendance (POST)
router.post('/attendance', protect, checkPermission('attendance:create'),logAction('attendance'), markAttendance);
router.get('/my-attendance', protect, getMyAttendanceByDate);
router.get('/attendance/by-date', protect, checkPermission('attendance:read'),logAction('attendance'), getAttendanceByDate);

// Route for getting a single user's attendance (GET)
router.get('/attendance/:userId', protect, checkPermission('attendance:read'),logAction('attendance'), getAttendanceForUser);

router.post(
    '/attendance/upload-csv',protect,checkPermission('attendance:create'), upload.single('attendanceCsv'),logAction('attendance'),uploadAttendanceCSV );

    router.get('/attendance/export', protect, checkPermission('attendance:read'),logAction('attendance'), exportAttendance);

// Ek khaas tareekh ki saari attendance get karna (GET)
router.get('/attendance/by-date', protect, checkPermission('attendance:read'),logAction('attendance'), getAttendanceByDate);

// Ek single user ki saari attendance get karna (GET)
// Yeh dynamic route hamesha aakhir mein hona chahiye
router.get('/attendance/:userId', protect, checkPermission('attendance:read'),logAction('attendance'), getAttendanceForUser);
module.exports = router;
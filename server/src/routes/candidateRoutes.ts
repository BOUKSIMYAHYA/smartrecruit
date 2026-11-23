import { Router } from 'express';
import { CandidateController } from '../controllers/candidateController.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadImage } from '../middleware/upload.js';

const router = Router();

// Profile & Avatar
router.get('/profile', authenticate, CandidateController.getProfile);
router.put('/profile', authenticate, CandidateController.updateProfile);
router.post('/avatar', authenticate, uploadImage.single('avatar'), CandidateController.uploadAvatar);
router.delete('/avatar', authenticate, CandidateController.deleteAvatar);

// Resumes
router.post('/resumes/upload', authenticate, upload.single('resume'), CandidateController.uploadResume);
router.post('/resumes/builder', authenticate, CandidateController.savePlatformResume);
router.get('/resumes/:resumeId/signed-url', authenticate, CandidateController.getResumeDownloadUrl);
router.get('/resumes/download', CandidateController.downloadResume); // Token in query param

// Cover Letters
router.post('/cover-letters', authenticate, upload.single('coverLetterFile'), CandidateController.saveCoverLetter);

export default router;

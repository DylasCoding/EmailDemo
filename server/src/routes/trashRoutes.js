import express from 'express';
import { authenticateJWT } from '../middlewares/authJwt.js';
import {addToTrashController, restoreThreadFromTrashController, deleteThreadPermanentlyController, getAllTrashThreadsController} from '../controllers/trashController.js';

const router = express.Router();

router.get('/get-all',authenticateJWT, getAllTrashThreadsController);
router.post('/add-to-trash/:id',authenticateJWT,addToTrashController);
router.post('/delete/:id',authenticateJWT, deleteThreadPermanentlyController);
router.post('/restore/:id',authenticateJWT, restoreThreadFromTrashController);

export default router;

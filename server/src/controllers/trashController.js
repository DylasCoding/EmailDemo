import {getAllTrashThreads, addToTrash, restoreThreadFromTrash, deleteThreadPermanently} from "../services/trashService.js";

export async function getAllTrashThreadsController(req, res) {
    try {
        const userId = req.user.id;
        const trashThreads = await getAllTrashThreads(userId);
        res.json({success: true, trashThreads});
    } catch (err) {
        res.status(500).json({success: false, error: err.message});
    }
}

export async function addToTrashController(req, res) {
    try {
        const userId = req.user.id;
        const threadId = req.params.id;
        const trashEntry = await addToTrash(userId, threadId);
        res.json({success: true, trashEntry});
    } catch (err) {
        res.status(500).json({success: false, error: err.message});
    }
}

export async function restoreThreadFromTrashController(req, res) {
    try {
        const userId = req.user.id;
        const threadId = req.params.id;
        await restoreThreadFromTrash(userId, threadId);
        res.json({success: true});
    } catch (err) {
        res.status(500).json({success: false, error: err.message});
    }
}

export async function deleteThreadPermanentlyController(req, res) {
    try {
        const userId = req.user.id;
        const threadId = req.params.id;
        await deleteThreadPermanently(userId, threadId);
        res.json({success: true});
    } catch (err) {
        res.status(500).json({success: false, error: err.message});
    }
}
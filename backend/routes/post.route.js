import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts, getPostById, deleteComment, likeComment, saveUnsavePost, getSavedPosts } from "../controllers/post.controller.js";
import { tagRateLimiter } from "../middleware/rateLimiter.js";


const router = express.Router();

router.post("/create", protectRoute, tagRateLimiter, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, tagRateLimiter, commentOnPost);
router.delete("/:id", protectRoute, deletePost);
router.get("/all", protectRoute, getAllPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/user/:username", protectRoute, getUserPosts);

router.delete("/comment/:id/:commentId", protectRoute, deleteComment);
router.post("/comment/like/:id/:commentId", protectRoute, likeComment);
router.get("/saved", protectRoute, getSavedPosts);
router.post("/save/:id", protectRoute, saveUnsavePost);
router.get("/:id", protectRoute, getPostById);
export default router;
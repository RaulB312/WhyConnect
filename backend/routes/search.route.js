import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { searchController } from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", protectRoute, searchController);

export default router;
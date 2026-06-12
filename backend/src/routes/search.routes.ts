import { Router } from "express";
import { SearchController } from "../controllers/search.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";

const router = Router();
router.get("/", asyncHandler(SearchController.search));

export default router;

import { Router } from "express";
import multer from "multer";
import { ResourcesController } from "../controllers/resources.controller.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router = Router();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

router.get("/images/:slug", asyncHandler(ResourcesController.getImage));
// Any authenticated user may upload (admins for branding/services, and every
// user — client or employee — for their own profile avatar).
router.post(
  "/images",
  asyncHandler(requireAuth),
  upload.single("image"),
  asyncHandler(ResourcesController.upload),
);

export default router;

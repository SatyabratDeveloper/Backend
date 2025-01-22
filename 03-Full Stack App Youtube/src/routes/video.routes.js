import { Router } from "express";
import { publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/publish-video")
  .post(verifyJWT, upload.single("video"), publishAVideo);

export default router;

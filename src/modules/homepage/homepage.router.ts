import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleMiddleware } from "../../middlewares/role.js";
import { upload, homepageUpload } from "../../middlewares/upload.js";
import {
  getHomepageController,
  getHomepageSectionController,
  upsertHomepageSectionController,
} from "./homepage.controller.js";

const routerHomepage = Router();

// Public — pengunjung / frontend publik baca konten homepage.
routerHomepage.get("/", getHomepageController);
routerHomepage.get("/:key", getHomepageSectionController);

// Admin — simpan konten + upload media (gambar, atau video khusus hero).
routerHomepage.put(
  "/:key",
  authMiddleware,
  roleMiddleware("ADMIN"),
  homepageUpload.single("image"),
  upsertHomepageSectionController,
);

export default routerHomepage;
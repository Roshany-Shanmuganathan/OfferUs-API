import express from "express";
import {
  getAllAdvertisments,
  getAdvertismentById,
  createAdvertisment,
  updateAdvertisment,
  deleteAdvertisment,
} from "../controllers/advertismentController.js";

const router = express.Router();

router.get("/", getAllAdvertisments);
router.get("/:id", getAdvertismentById);
router.post("/", createAdvertisment);
router.put("/:id", updateAdvertisment);
router.delete("/:id", deleteAdvertisment);

export default router;

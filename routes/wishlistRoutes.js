import express from "express";
import {
  getAllWishlists,
  getWishlistById,
  createWishlist,
  updateWishlist,
  deleteWishlist,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.get("/", getAllWishlists);
router.get("/:id", getWishlistById);
router.post("/", createWishlist);
router.put("/:id", updateWishlist);
router.delete("/:id", deleteWishlist);

export default router;

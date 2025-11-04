import express from "express";
import {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
} from "../controllers/shopController.js";

const router = express.Router();

router.get("/", getAllShops);
router.get("/:id", getShopById);
router.post("/", createShop);
router.put("/:id", updateShop);
router.delete("/:id", deleteShop);

export default router;

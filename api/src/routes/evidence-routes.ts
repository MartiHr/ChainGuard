import express from "express";
import { getByWallet, getPublic } from "../controllers/evidence-controller";

const router = express.Router();

router.get("/public", getPublic);
router.get("/:walletAddress", getByWallet);

export default router;

import express from "express";
import {
  getProfiles,
  getProfileByUserId,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/profilesController.js";

const router = express.Router();

router.get("/", getProfiles);
router.get("/:userId", getProfileByUserId);
router.post("/", createProfile);
router.put("/:userId", updateProfile);
router.delete("/:userId", deleteProfile);

export default router;

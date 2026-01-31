import express from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/servicesController.js";
import { requireAuth } from "../middleware/auth.js";


const router = express.Router();

router.get("/", requireAuth, getServices);
router.get("/:id", requireAuth, getServiceById);
router.post("/", requireAuth, createService);
router.put("/:id", requireAuth, updateService);
router.delete("/:id", requireAuth, deleteService);

export default router;

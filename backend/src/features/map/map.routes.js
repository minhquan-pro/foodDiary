import { Router } from "express";
import authenticate from "../../middleware/authenticate.js";
import * as mapController from "./map.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", mapController.getMapData);
router.post("/location", mapController.setLocation);
router.delete("/location", mapController.clearLocation);

export default router;

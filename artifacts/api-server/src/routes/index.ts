import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import doctorsRouter from "./doctors";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import slotsRouter from "./slots";
import reportsRouter from "./reports";
import prescriptionsRouter from "./prescriptions";
import reviewsRouter from "./reviews";
import leaveBlocksRouter from "./leave-blocks";
import emergencyRouter from "./emergency";
import searchRouter from "./search";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(doctorsRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(slotsRouter);
router.use(reportsRouter);
router.use(prescriptionsRouter);
router.use(reviewsRouter);
router.use(leaveBlocksRouter);
router.use(emergencyRouter);
router.use(searchRouter);
router.use(adminRouter);

export default router;

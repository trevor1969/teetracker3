import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teaTypesRouter from "./tea-types";
import brewingMethodsRouter from "./brewing-methods";
import teaSessionsRouter from "./tea-sessions";
import statsRouter from "./stats";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teaTypesRouter);
router.use(brewingMethodsRouter);
router.use(teaSessionsRouter);
router.use(statsRouter);
router.use(uploadsRouter);

export default router;

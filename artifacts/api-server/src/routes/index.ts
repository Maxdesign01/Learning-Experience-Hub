import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vibelearnRouter from "./vibelearn";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vibelearnRouter);

export default router;

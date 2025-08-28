import {Router} from "express";
import { registerUser } from "../controllers/user.conrollers.js";

const router =Router();

router.route('/register').post(registerUser);

export default router;
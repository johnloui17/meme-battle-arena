import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema, googleSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), authController.register);
authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.post("/google", validate(googleSchema), authController.google);
authRoutes.post("/password/forgot", validate(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post("/password/reset", validate(resetPasswordSchema), authController.resetPassword);
authRoutes.post("/token/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);

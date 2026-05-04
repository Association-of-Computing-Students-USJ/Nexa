// Controllers translate HTTP requests to service calls.
import { z } from "zod";
import { login } from "../services/authService.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function postLogin(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body.email, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}


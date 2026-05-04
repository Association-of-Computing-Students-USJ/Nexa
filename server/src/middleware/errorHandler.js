// Final error-handling middleware; converts thrown errors to JSON responses.
import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
}


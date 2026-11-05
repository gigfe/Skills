import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodType } from 'zod';
import { AppError } from './error-handler.middleware';

// Zod está fijo en este stack. Un único middleware genérico alcanza para toda
// entidad; se monta con el schema puntual de cada ruta.
export function validateBody(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(result.error.issues.map((issue) => issue.message).join(', '), 400));
    }
    req.body = result.data;
    next();
  };
}

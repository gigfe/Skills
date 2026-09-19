import { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    // Mensaje de negocio, ya pensado para mostrarse al cliente (4xx).
    return res.status(err.statusCode).json({ error: { message: err.message } });
  }

  console.error(err);

  // Errores no esperados (500): nunca exponer el mensaje/stack real en
  // producción — puede filtrar detalles de la base de datos, rutas de
  // archivos o lógica interna. En dev sí ayuda a debuggear.
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err instanceof Error
        ? err.message
        : 'Error desconocido';

  return res.status(500).json({ error: { message } });
}

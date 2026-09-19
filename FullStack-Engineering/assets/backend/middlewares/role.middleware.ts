import { NextFunction, Response, RequestHandler } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './error-handler.middleware';
import type { Permiso } from '../permissions';

// Se montan despues de `verifyToken`, que ya dejo los permisos del usuario
// resueltos en `req.user`. Por eso el chequeo es sincronico y no vuelve a
// tocar la base.
//
// Siempre se pide un PERMISO, nunca un rol: `requirePermission(PERMISOS.X)` y
// jamas `if (req.user.rol === 'Administrador')`. Preguntar por capacidad hace
// que un rol nuevo creado en la base funcione sin tocar una linea de codigo.

/** Exige TODOS los permisos indicados. */
export function requirePermission(...permisos: Permiso[]): RequestHandler {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const concedidos = req.user?.permisos;
    if (!concedidos || !permisos.every((permiso) => concedidos.has(permiso))) {
      return next(new AppError('No tenés permiso para esta acción', 403));
    }
    next();
  };
}

/** Variante para endpoints que aceptan varias vias de acceso: basta con uno. */
export function requireAnyPermission(...permisos: Permiso[]): RequestHandler {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const concedidos = req.user?.permisos;
    if (!concedidos || !permisos.some((permiso) => concedidos.has(permiso))) {
      return next(new AppError('No tenés permiso para esta acción', 403));
    }
    next();
  };
}

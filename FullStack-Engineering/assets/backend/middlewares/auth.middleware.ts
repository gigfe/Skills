import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error-handler.middleware';
import { cargarUsuarioAutorizado, type CodigoRol, type PermisosDelUsuario } from '../permissions';

/**
 * El token lleva lo minimo e inmutable: quien es. El rol y los permisos NO
 * viajan en el a proposito — si viajaran, cambiarle el rol a alguien o quitarle
 * un permiso no tendria efecto hasta que el token expire.
 */
export interface JwtPayload {
  id: number;
}

/** Identidad ya resuelta del request: quien es, que rol tiene y que puede hacer. */
export interface UsuarioAutenticado {
  id: number;
  rol: CodigoRol;
  permisos: PermisosDelUsuario;
}

export interface AuthenticatedRequest extends Request {
  user?: UsuarioAutenticado;
}

export const verifyToken: RequestHandler = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Token no provisto', 401));
  }

  const token = header.slice('Bearer '.length);
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }

  // Una sola consulta resuelve las tres cosas: que la cuenta siga activa (el
  // JWT sigue "vigente" hasta que expire aunque desactiven al usuario en el
  // medio), que rol tiene ahora, y que permisos tiene ese rol ahora.
  const autorizado = await cargarUsuarioAutorizado(payload.id);
  if (!autorizado) {
    return next(new AppError('Esta cuenta fue desactivada', 401));
  }

  req.user = { id: payload.id, ...autorizado };
  next();
};

// Autenticar no alcanza: hay que confirmar que el usuario logueado es dueño
// del recurso que pide. Sin esto, cualquier usuario autenticado podría leer
// o modificar recursos de otro solo adivinando el ID en la URL (IDOR).
// Uso: `assertOwner(recurso.userId, req.user.id)` dentro del controller/service
// antes de devolver o modificar el recurso.
export function assertOwner(resourceOwnerId: number, requestingUserId: number | undefined) {
  if (requestingUserId === undefined || resourceOwnerId !== requestingUserId) {
    throw new AppError('No tenés permiso sobre este recurso', 403);
  }
}

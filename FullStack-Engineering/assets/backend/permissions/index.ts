import { prisma } from '../config/db';
import { PERMISOS, type CodigoRol, type Permiso } from './catalogo';

export * from './catalogo';

// Las concesiones rol -> permisos viven en la base y se resuelven POR REQUEST,
// no en una cache global de proceso.
//
// La cache parece la opcion obvia (los permisos cambian una vez cada varios
// meses), pero rompe justamente lo que motiva moverlos a la base: un rol creado
// en caliente no existiria hasta reiniciar el backend, y mientras tanto sus
// usuarios quedarian sin ningun permiso. Encima, con varias instancias del
// backend cada una tendria su propia copia desactualizada.
//
// El costo de resolverlos por request es un `include` dentro de la consulta que
// `verifyToken` YA hace para comprobar que la cuenta no este desactivada.

/** Permisos concedidos a un usuario, listos para consultar sin ir a la base. */
export type PermisosDelUsuario = ReadonlySet<Permiso>;

/**
 * Trae rol y permisos de un usuario activo. Devuelve null si no existe o esta
 * desactivado, para que el middleware no tenga que hacer dos consultas.
 */
export async function cargarUsuarioAutorizado(usuarioId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      desactivadoEn: true,
      rol: {
        select: {
          rol: true,
          permisos: { select: { permiso: { select: { codigo: true } } } },
        },
      },
    },
  });

  if (!usuario || usuario.desactivadoEn) return null;

  return {
    rol: usuario.rol.rol as CodigoRol,
    permisos: new Set(usuario.rol.permisos.map((rp) => rp.permiso.codigo as Permiso)) as PermisosDelUsuario,
  };
}

/** Permisos de un rol por su codigo. Lo usa el login para informarselos al cliente. */
export async function permisosDeRol(rol: CodigoRol): Promise<Permiso[]> {
  const fila = await prisma.rol.findUnique({
    where: { rol },
    select: { permisos: { select: { permiso: { select: { codigo: true } } } } },
  });

  return fila?.permisos.map((rp) => rp.permiso.codigo as Permiso) ?? [];
}

/**
 * Roles que tienen un permiso dado. Lo usan las consultas que filtran usuarios
 * por capacidad (ej. a quien se le puede asignar algo) sin nombrar un rol
 * concreto — asi un rol nuevo con ese permiso entra solo.
 */
export async function rolesConPermiso(permiso: Permiso): Promise<CodigoRol[]> {
  const roles = await prisma.rol.findMany({
    where: { permisos: { some: { permiso: { codigo: permiso } } } },
    select: { rol: true },
  });

  return roles.map((r) => r.rol);
}

/** Chequeo sincronico contra los permisos ya resueltos del request. */
export function tienePermiso(permisos: PermisosDelUsuario, permiso: Permiso): boolean {
  return permisos.has(permiso);
}

/**
 * Verifica que el catalogo del codigo exista completo en la base. Llamarlo al
 * arrancar: si falta una fila, el endpoint que pide ese permiso queda
 * inalcanzable para todos y conviene enterarse ahi y no con un 403 en produccion.
 */
export async function permisosFaltantesEnBase(): Promise<Permiso[]> {
  const enBase = new Set((await prisma.permiso.findMany({ select: { codigo: true } })).map((p) => p.codigo));
  return Object.values(PERMISOS).filter((codigo) => !enBase.has(codigo));
}

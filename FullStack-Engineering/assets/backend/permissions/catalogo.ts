// Catalogo de capacidades del sistema. Se copia a
// /backend/src/core/permissions/catalogo.ts y se adapta a los permisos que
// pida el dominio.
//
// Que un permiso EXISTA se define aca, en codigo, porque son exactamente los
// codigos que las rutas piden con `requirePermission`. A QUIEN se le concede
// cada uno vive en la base (tabla RolPermiso) y se edita sin redeploy.
//
// Esa division es deliberada: si el catalogo tambien viviera en la base, un
// typo en un INSERT dejaria una ruta pidiendo un permiso que nadie puede tener
// —y nadie se enteraria hasta el 403—, y el compilador no podria avisar de un
// permiso que se dejo de usar.

export const PERMISOS = {
  TAREA_CREAR: 'tarea:crear',
  TAREA_LEER_TODAS: 'tarea:leer:todas',
  USUARIO_LEER: 'usuario:leer',
  USUARIO_CREAR: 'usuario:crear',
  USUARIO_DESACTIVAR: 'usuario:desactivar',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

/**
 * Un rol es una fila de la tabla `Rol`, no un valor cerrado del codigo: por eso
 * el tipo es `string`. El alias existe para que las firmas digan que esperan
 * ("el codigo del rol") en vez de un `string` anonimo.
 */
export type CodigoRol = string;

/** Texto que se muestra al administrar permisos: "sla:editar" no le dice nada a nadie. */
export const DESCRIPCION_PERMISO: Record<Permiso, string> = {
  [PERMISOS.TAREA_CREAR]: 'Crear tareas',
  [PERMISOS.TAREA_LEER_TODAS]: 'Ver todas las tareas del sistema, no solo las propias',
  [PERMISOS.USUARIO_LEER]: 'Ver el listado de cuentas',
  [PERMISOS.USUARIO_CREAR]: 'Dar de alta cuentas',
  [PERMISOS.USUARIO_DESACTIVAR]: 'Desactivar cuentas',
};

// --- Semilla ---
// Solo el punto de partida de una instalacion nueva. El seed las crea si no
// existen y NUNCA pisa lo que el administrador haya cambiado despues: a partir
// del primer arranque, la base manda.

export const ROLES_SEMILLA = {
  USUARIO: 'Usuario',
  ADMINISTRADOR: 'Administrador',
} as const;

export const PERMISOS_INICIALES_POR_ROL: Record<string, readonly Permiso[]> = {
  [ROLES_SEMILLA.USUARIO]: [PERMISOS.TAREA_CREAR],
  [ROLES_SEMILLA.ADMINISTRADOR]: [
    PERMISOS.TAREA_CREAR,
    PERMISOS.TAREA_LEER_TODAS,
    PERMISOS.USUARIO_LEER,
    PERMISOS.USUARIO_CREAR,
    PERMISOS.USUARIO_DESACTIVAR,
  ],
};

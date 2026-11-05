import { ref } from 'vue';

// Solo decide qué se muestra; el backend autoriza en cada request.
// Carga la lista desde GET /api/me/permissions (SP app.user_permissions) al iniciar sesión.
const permissions = ref<Set<string>>(new Set());

export function usePermissions() {
  return {
    setPermissions: (codes: string[]) => {
      permissions.value = new Set(codes);
    },
    can: (code: string) => permissions.value.has(code),
  };
}

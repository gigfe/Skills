# Frontend — Convenciones React + Vite + Tailwind

## Estructura (Fase 4 de `dev-FS`)

```
src/
  components/   # UI reutilizable, sin lógica de negocio
  pages/        # una por ruta
  hooks/        # lógica reutilizable con estado (ej. usePagination)
  services/     # llamadas a la API, centralizadas — nada de fetch() suelto en componentes
  types/        # tipos compartidos entre páginas/componentes
  schemas/      # Zod, si el frontend valida formularios antes de mandarlos
  context/      # estado global simple (ej. usuario autenticado), Context API alcanza salvo necesidad real de algo más
```

## Capa `services/`

Un archivo por entidad (`taskService.ts`), base URL desde `VITE_API_URL` (`.env` de Vite) — nunca hardcodeada. `VITE_*` nunca es secreto: Vite lo embebe en el bundle público en build time, no lo ocultes ahí.

```typescript
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchTasks(page: number, token: string) {
  const res = await fetch(`${API_URL}/tasks?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al cargar tareas');
  return res.json();
}
```

## Formularios

`useState` simple alcanza para la mayoría de los formularios de un CRUD — no agregar una librería de formularios (React Hook Form, Formik) sin necesidad real (formularios grandes con muchas validaciones cruzadas). Ver `assets/frontend/LoginForm.tsx` como patrón base: estado por campo, un estado de error, un estado de loading.

## Tabla/listado reutilizable

`assets/frontend/DataTable.tsx` — paginado, columnas tipadas genéricamente por `keyof T`, con `render` opcional por columna para casos custom (badges, formato de fecha). Es el punto de partida para cualquier listado nuevo, adaptando las columnas a la entidad real.

## Tailwind

Clases utilitarias directas en el JSX, sin capa de CSS-in-JS adicional. Paleta neutra (`slate`) por defecto para UI interna — no es un sitio de marca, prioriza consistencia y legibilidad sobre identidad visual distintiva (mismo argumento que usa la skill hermana `Software Engineering` para no aplicar el plugin "frontend-design" acá).

## Responsive (mobile-first)

Diseñar mobile-first: escribí primero las clases sin prefijo (aplican a mobile) y agregá
`sm:`/`md:`/`lg:`/`xl:` solo donde el layout necesita cambiar en pantallas más grandes — nunca al
revés (armar para desktop y "parchear" mobile al final), porque ahí es donde se cuelan overflows
horizontales, botones que no entran y texto cortado.

Breakpoints fijos de Tailwind, no se inventan valores custom salvo necesidad real:

```
sm:  640px   — tablets chicas / mobile landscape
md:  768px   — tablets
lg:  1024px  — laptop
xl:  1280px  — desktop grande
```

Patrones que se repiten en casi todo CRUD interno:

- **Layout de página**: `flex flex-col` en mobile (todo apilado) → `lg:flex-row` cuando hay
  sidebar + contenido. Nunca un sidebar fijo en `px` que no colapsa en mobile.
- **Grids de tarjetas/formularios**: `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` — una
  columna en mobile es el default seguro, no una excepción.
- **`DataTable`** (`assets/frontend/DataTable.tsx`): en mobile una tabla ancha se corta o fuerza
  scroll horizontal incómodo — envolver en `overflow-x-auto` como mínimo; si la entidad tiene
  pocas columnas clave, considerar un layout de tarjetas apiladas en `<sm:` en vez de forzar la
  tabla completa.
- **Formularios** (`LoginForm.tsx` y similares): `w-full max-w-sm` centrado funciona en mobile y
  desktop por igual sin breakpoints extra — es el patrón por defecto para formularios chicos
  (login, creación de un registro).
- **Botones de acción en listados**: en mobile, texto + ícono puede no entrar en la fila — usar
  solo ícono con `aria-label` en `<sm:` y agregar el texto a partir de `sm:inline`.

Caso de referencia real: en `LoginPage.tsx` de un proyecto reciente el formulario estaba bien
escrito en Tailwind (`w-full max-w-sm`, estados `focus` correctos) pero nunca se verificó en un
viewport angosto ni se pensó en estados de error/loading más allá de lo mínimo — quedó
funcionalmente correcto pero sin que nadie revisara el resultado real en mobile. La lección: el
checklist final de `SKILL.md` incluye "probado mentalmente en mobile" como paso explícito, no
asumido.

## Seguridad en frontend

React escapa el contenido por defecto — el riesgo real de XSS está en `dangerouslySetInnerHTML` o en renderizar HTML/markdown que viene de un tercero sin sanitizar. Ver el detalle completo en `security.md`.

# Perfil ERP — Vue 3 + PrimeVue + Tailwind

## Estructura

Por funcionalidad, no por tipo de archivo: un cambio en "alquileres" no debería tocar diez carpetas.

```
frontend/src/
  features/rentals/
    RentalOrdersPage.vue
    components/
    rentals.api.ts      # llamadas HTTP de la feature
    rentals.schemas.ts  # Zod
    rentals.types.ts
  shared/
    api/http.ts         # cliente único
    components/         # solo lo reutilizado de verdad
    composables/        # usePermissions, useLazyTable
  router/  stores/  layouts/  main.ts
```

## Convenciones

- `<script setup lang="ts">` y Composition API.
- **Estado:** local primero; Pinia solo para lo global (sesión, permisos). Los datos del servidor no se
  copian a un store sin motivo: se desincronizan.
- **HTTP:** siempre `shared/api/http.ts`, con base URL y manejo de 401 y errores. Nada de `fetch` en
  componentes. `VITE_*` se embebe en el bundle: nunca es secreto.
- **Formularios:** valida con el esquema Zod compartido, y muestra también el error del backend, porque
  la regla real está en el SP.
- **Permisos:** `can(PERMISOS.X)` decide qué se muestra. Es solo presentación; el backend autoriza.
  Los roles asignables salen de la API.

## PrimeVue

Confirma la versión instalada antes de escribir configuración: PrimeVue 4 cambió el sistema de temas
y la integración con Tailwind respecto a versiones anteriores. Consulta su documentación y sigue el
preset que el repo ya tenga.

- Usa los componentes de PrimeVue antes de crear uno propio. Tailwind es para layout y espaciado, no
  para reescribir su apariencia.
- **`DataTable`** en modo `lazy` para listas grandes: página, orden y filtro van al servidor. Ver
  `assets/erp/frontend/RentalOrdersPage.vue`.
- Usa `ConfirmDialog` para acciones destructivas y `Toast` para resultados.
- Aplica `v-tooltip` y `aria-label` a botones de solo ícono.
- Registra componentes de forma local o con el resolver automático para no inflar el bundle.

## Responsive

Mobile-first: clases sin prefijo para móvil, y `sm:`, `md:`, `lg:`, `xl:` donde cambia el layout.

- Layout: `flex flex-col lg:flex-row`; sidebar colapsable, nunca fijo en `px`.
- Formularios: `grid grid-cols-1 gap-4 md:grid-cols-2`.
- `DataTable`: `scrollable`, con pocas columnas clave en móvil o tarjetas si la lista se consulta en
  campo (almacén, técnicos).

## Seguridad

Vue escapa la interpolación. El riesgo está en `v-html` con contenido de usuario o de terceros:
evítalo, o sanitiza con DOMPurify. Prefiere cookie `httpOnly` para la sesión; con `localStorage`, un
XSS puede robar el token.

## Estados obligatorios

Toda pantalla de datos contempla carga, vacío, error y sin permiso. Son la diferencia entre una demo y
un sistema que la gente usa a diario.

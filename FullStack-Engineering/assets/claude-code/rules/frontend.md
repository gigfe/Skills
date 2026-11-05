---
paths:
  - "frontend/**"
---
# Frontend

- `<script setup lang="ts">`. Organiza por `features/`.
- HTTP solo con `shared/api/http.ts`. `VITE_*` nunca es secreto.
- Usa PrimeVue antes de crear un componente; Tailwind para layout, mobile-first.
- `can()` solo decide qué se muestra; el backend autoriza.
- Toda pantalla de datos contempla carga, vacío, error y sin permiso.
- Evita `v-html`; si es indispensable, sanitiza con DOMPurify.

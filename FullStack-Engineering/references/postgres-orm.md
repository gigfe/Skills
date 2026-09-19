# Postgres — Prisma vs Drizzle

Se pregunta una vez por proyecto (ver flujo de scaffolding en `SKILL.md`), revisando primero `.claude/memory/context.md` y si ya existe `prisma/schema.prisma` o `drizzle/schema.ts` en el proyecto — no se repregunta si ya hay evidencia.

## Cuándo conviene cada uno

- **Prisma**: mejor developer experience, cliente autogenerado y tipado, migraciones con `prisma migrate dev` casi sin fricción. Punto de entrada por defecto para alguien afianzando el stack — recomendalo si el usuario no tiene preferencia.
- **Drizzle**: más cercano al SQL puro (las queries se leen casi como SQL), sin paso de generación de cliente, mejor cuando la base de datos ya existe y tiene un schema complejo que no calza bien con las convenciones de Prisma.

No hay opción incorrecta — ambos dan migraciones versionadas y queries parametrizadas (protección contra SQL injection por diseño, ver `security.md`). Elegir uno y no mezclar ambos en el mismo proyecto.

## Setup

**Prisma**:
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
# editar prisma/schema.prisma (ver assets/prisma/schema.prisma.example)
npx prisma migrate dev --name init
```

**Drizzle**:
```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
# editar drizzle/schema.ts (ver assets/drizzle/schema.ts.example)
# y drizzle.config.ts (ver assets/drizzle/drizzle.config.ts.example)
npx drizzle-kit generate
npx drizzle-kit migrate
```

Ambos leen la conexión de la misma variable `DATABASE_URL` en `.env` — no hay variables separadas por ORM.

## Transacciones

**Prisma**:
```typescript
const [rows, count] = await prisma.$transaction([
  prisma.task.findMany({ where: { userId } }),
  prisma.task.count({ where: { userId } }),
]);
```

**Drizzle**:
```typescript
await db.transaction(async (tx) => {
  await tx.insert(tasks).values(data);
  await tx.update(users).set({ taskCount: sql`${users.taskCount} + 1` }).where(eq(users.id, userId));
});
```

## Nombres que no hay que confundir

- `/backend/src/schemas/` — validación **Zod** de inputs de request (qué puede mandar el cliente).
- `/backend/prisma/schema.prisma` o `/backend/drizzle/schema.ts` — definición de **tablas** de la base de datos.

Son cosas distintas que suenan parecido — no fusionarlas ni nombrarlas igual.

## Pooling (diferido)

En dev y en proyectos chicos, el pool default de Prisma/`pg` alcanza. Si el proyecto escala a múltiples réplicas del backend contra la misma base, considerar PgBouncer delante de Postgres — no agregarlo sin esa señal real, mismo criterio de `dev-FS` para todo lo que cuesta configuración.

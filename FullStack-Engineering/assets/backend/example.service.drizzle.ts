import { eq, and, count, desc } from 'drizzle-orm';
import { db } from './config/db.drizzle';
import { tasks } from '../drizzle/schema';
import { AppError } from './middlewares/error-handler.middleware';
import { assertOwner } from './middlewares/auth.middleware';
import type { CreateTaskInput, UpdateTaskInput } from './example.schema';

export async function listTasks(userId: number, page: number, pageSize: number) {
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(tasks).where(eq(tasks.userId, userId)),
  ]);

  return { rows, total };
}

export async function getTaskById(id: number, userId: number) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) {
    throw new AppError('Tarea no encontrada', 404);
  }
  assertOwner(task.userId, userId);
  return task;
}

export async function createTask(userId: number, data: CreateTaskInput) {
  const [task] = await db
    .insert(tasks)
    .values({ ...data, userId })
    .returning();
  return task;
}

export async function updateTask(id: number, userId: number, data: UpdateTaskInput) {
  await getTaskById(id, userId); // valida existencia + ownership antes de escribir
  const [task] = await db.update(tasks).set(data).where(and(eq(tasks.id, id))).returning();
  return task;
}

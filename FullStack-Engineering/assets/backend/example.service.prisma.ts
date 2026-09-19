import { prisma } from './config/db.prisma';
import { AppError } from './middlewares/error-handler.middleware';
import { assertOwner } from './middlewares/auth.middleware';
import type { CreateTaskInput, UpdateTaskInput } from './example.schema';

export async function listTasks(userId: number, page: number, pageSize: number) {
  const [rows, total] = await prisma.$transaction([
    prisma.task.findMany({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where: { userId } }),
  ]);

  return { rows, total };
}

export async function getTaskById(id: number, userId: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new AppError('Tarea no encontrada', 404);
  }
  assertOwner(task.userId, userId);
  return task;
}

export async function createTask(userId: number, data: CreateTaskInput) {
  return prisma.task.create({ data: { ...data, userId } });
}

export async function updateTask(id: number, userId: number, data: UpdateTaskInput) {
  await getTaskById(id, userId); // valida existencia + ownership antes de escribir
  return prisma.task.update({ where: { id }, data });
}

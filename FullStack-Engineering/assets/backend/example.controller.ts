import { Response } from 'express';
import { asyncHandler } from './middlewares/error-handler.middleware';
import { AuthenticatedRequest } from './middlewares/auth.middleware';
import * as taskService from './example.service.prisma'; // o './example.service.drizzle', según el ORM elegido

export const listTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);

  const result = await taskService.listTasks(req.user!.id, page, pageSize);
  res.json(result);
});

export const getTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const task = await taskService.getTaskById(Number(req.params.id), req.user!.id);
  res.json(task);
});

export const createTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // req.body ya viene validado y tipado por validateBody(createTaskSchema) montado en la ruta.
  const task = await taskService.createTask(req.user!.id, req.body);
  res.status(201).json(task);
});

export const updateTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const task = await taskService.updateTask(Number(req.params.id), req.user!.id, req.body);
  res.json(task);
});

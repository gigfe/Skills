import { Router } from 'express';
import * as taskController from './example.controller';
import { verifyToken } from './middlewares/auth.middleware';
import { validateBody } from './middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from './example.schema';

const router = Router();

router.use(verifyToken); // todo este recurso requiere estar autenticado

router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.post('/', validateBody(createTaskSchema), taskController.createTask);
router.put('/:id', validateBody(updateTaskSchema), taskController.updateTask);

export default router;

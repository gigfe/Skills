import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler.middleware';
// import exampleRoutes from './example.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  }),
);
app.use(express.json());

// app.use('/api/examples', exampleRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API corriendo en http://localhost:${env.PORT}`);
});

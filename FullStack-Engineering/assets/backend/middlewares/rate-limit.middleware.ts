import rateLimit from 'express-rate-limit';

// Se aplica solo a endpoints sensibles (login, registro), no globalmente —
// un rate limit global penaliza tráfico legítimo sin proteger nada puntual.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos, probá de nuevo en unos minutos' } },
});

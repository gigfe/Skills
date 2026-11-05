// Error de negocio, sin dependencias de framework: application/ y domain/ pueden usarlo.
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number = 422,
  ) {
    super(message);
  }
}

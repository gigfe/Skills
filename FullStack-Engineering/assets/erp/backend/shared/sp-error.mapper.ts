import { DomainError } from './domain.error';

// Catálogo de SQLSTATE propios. Un solo lugar por proyecto.
const BUSINESS_ERRORS: Record<string, { status: number; code: string }> = {
  BR001: { status: 422, code: 'INVALID_DATE_RANGE' },
  BR002: { status: 409, code: 'EQUIPMENT_NOT_AVAILABLE' },
};

// La forma del error crudo cambia según versión de Prisma y driver adapter, por eso se busca el
// SQLSTATE en varios lugares. Un test de integración con BR001 real debe cubrir este mapeo.
function extractSqlState(error: unknown): string | undefined {
  const raw = error as {
    code?: unknown;
    meta?: { code?: unknown; driverAdapterError?: { cause?: { originalCode?: unknown } } };
  };
  const candidates = [raw?.meta?.code, raw?.meta?.driverAdapterError?.cause?.originalCode, raw?.code];
  return candidates.find((value): value is string => typeof value === 'string' && value in BUSINESS_ERRORS);
}

function extractMessage(error: unknown): string {
  const raw = error as { meta?: { message?: unknown }; message?: unknown };
  const text = String(raw?.meta?.message ?? raw?.message ?? '');
  // Se conserva solo el mensaje pensado para el usuario, sin el prefijo del driver.
  return text.match(/ERROR:\s*(.+)/)?.[1]?.trim() ?? text;
}

export function mapSpError(error: unknown): never {
  const sqlState = extractSqlState(error);
  if (sqlState) {
    const { status, code } = BUSINESS_ERRORS[sqlState];
    throw new DomainError(code, extractMessage(error), status);
  }
  throw error; // Inesperado: el filtro responde 500 genérico y registra el detalle.
}

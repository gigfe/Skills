// Cliente HTTP único. La sesión viaja en cookie httpOnly.
const BASE_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? 'Ocurrió un error. Intenta de nuevo.',
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

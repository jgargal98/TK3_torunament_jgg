import { HttpErrorResponse } from '@angular/common/http';

/** Base URL of the backend. The dev server proxies /api to http://localhost:8000. */
export const API_BASE_URL = '/api';

/** Turns an HTTP error into a readable message, using FastAPI's `detail` when present. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join('. ');
    }
    // With the backend stopped the dev proxy answers 500 with no detail.
    if (error.status === 0 || error.status >= 500) {
      return 'No se puede conectar con el backend. ¿Está arrancado en el puerto 8000?';
    }
    return `Error ${error.status}: ${error.statusText}`;
  }
  return 'Error inesperado';
}

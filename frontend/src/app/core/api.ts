import { HttpErrorResponse } from '@angular/common/http';

/** Base URL of the backend. The dev server proxies /api to http://localhost:8000. */
export const API_BASE_URL = '/api';

/** Turns an HTTP error into a readable message, using FastAPI's `detail` when present. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status === 504) {
      return 'No se puede conectar con el backend. ¿Está arrancado en el puerto 8000?';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join('. ');
    }
    return `Error ${error.status}: ${error.statusText}`;
  }
  return 'Error inesperado';
}

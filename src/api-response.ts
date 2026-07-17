export interface ApiSuccess<T> {
  ok: true;
  data: T;
}
export interface ApiEmptySuccess {
  ok: true;
}
export interface ApiFailure {
  ok: false;
  error: string;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function apiSuccess(): ApiEmptySuccess;
export function apiSuccess<T>(data: T): ApiSuccess<T>;
export function apiSuccess<T>(data?: T): ApiSuccess<T> | ApiEmptySuccess {
  return data === undefined ? { ok: true } : { ok: true, data };
}
export function apiFailure(error: string): ApiFailure {
  return { ok: false, error };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiOk<T> {
  data: T;
}

export type ApiResult<T> = ApiOk<T> | { error: ApiError };

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  nextCursor?: string;
}

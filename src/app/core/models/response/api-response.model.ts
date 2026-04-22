import { ResponseStatus } from "@core/enums/response-status.enum";

export class ApiResponse<T> {
  status: ResponseStatus;
  message: string;
  code: string | number;
  data: Record<string, T> | T;
  errors: unknown;

  constructor(response: Record<string, unknown>) {
    this.status = response['status'] as ResponseStatus;
    this.message = response['message'] as string;
    this.code = response['code'] as string | number;
    this.data = response['data'] as T | Record<string, T>;
    this.errors = response['errors'] ?? null;
  }
}

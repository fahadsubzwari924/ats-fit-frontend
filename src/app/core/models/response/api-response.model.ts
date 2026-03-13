import { ResponseStatus } from "@core/enums/response-status.enum";

export class ApiResponse<T> {
  status: ResponseStatus;
  message: string;
  code: string | number;
  data: { [key: string]: T } | T;
  errors: any | null;

  constructor(response: any) {
    this.status = response?.status;
    this.message = response?.message;
    this.code = response?.code;
    this.data = response?.data;
    this.errors = response?.errors;
  }
}

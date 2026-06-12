export default class RuntimeException extends Error {
  code: Exception;
  resource?: Resource;

  constructor(
    message: string,
    code: Exception = "INTERNAL_SERVER_ERROR",
    resource?: Resource,
  ) {
    super(message);
    this.code = code;
    this.resource = resource;
  }
}

type Exception = "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

export type Resource = "SERVICE" | "EMPLOYEE" | "APPOINTMENT" | "UNKNOW";

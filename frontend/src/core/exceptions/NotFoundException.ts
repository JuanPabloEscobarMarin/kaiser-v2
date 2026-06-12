import RuntimeException, { type Resource } from "./RuntimeException";

export default class NotFoundException extends RuntimeException {
  constructor(message: string, resource: Resource = "UNKNOW") {
    super(message, "NOT_FOUND", resource);
  }
}

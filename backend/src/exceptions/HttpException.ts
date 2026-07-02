export class HttpException extends Error {
  readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "No encontrado") {
    super(message, 404);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "Conflicto") {
    super(message, 409);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Solicitud inválida") {
    super(message, 400);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Acceso denegado") {
    super(message, 403);
  }
}

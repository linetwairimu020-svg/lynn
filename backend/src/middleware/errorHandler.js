export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export function errorHandler(error, _request, response, _next) {
  if (response.headersSent) {
    return;
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;
  const code = status === 500 ? 'INTERNAL_SERVER_ERROR' : (error.code || 'REQUEST_ERROR');
  const message = status === 500 ? 'An unexpected server error occurred.' : error.message;

  if (status >= 500) {
    console.error(error);
  }
  response.status(status).json({ error: { code, message } });
}

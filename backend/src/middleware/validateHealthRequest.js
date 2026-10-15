import { HttpError } from './errorHandler.js';

export function validateHealthRequest(request, _response, next) {
  if (Object.keys(request.query).length > 0) {
    next(new HttpError(400, 'INVALID_QUERY', 'The health endpoint does not accept query parameters.'));
    return;
  }
  next();
}

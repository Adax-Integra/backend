// B-02: validates the body of the verification review (approve or reject)
const ALLOWED_STATUSES = ['VERIFICADO', 'NO_VERIFICADO'];
const MAX_REASON_LENGTH = 500;

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

class ReviewVerificationValidator {
  static validateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError('Request body must be an object');
    }

    if (!ALLOWED_STATUSES.includes(body.status)) {
      throw validationError(
        `status must be one of: ${ALLOWED_STATUSES.join(', ')}`
      );
    }

    // The reason is optional and only meaningful when rejecting
    let reason = null;
    if (body.reason !== undefined && body.reason !== null) {
      if (typeof body.reason !== 'string') {
        throw validationError('reason must be a string');
      }
      const trimmed = body.reason.trim();
      if (trimmed.length > MAX_REASON_LENGTH) {
        throw validationError(
          `reason must be at most ${MAX_REASON_LENGTH} characters`
        );
      }
      reason = trimmed.length > 0 ? trimmed : null;
    }

    return { status: body.status, reason };
  }
}

export default ReviewVerificationValidator;

import rateLimit from 'express-rate-limit';

//Common options: send RateLimit-*, drop legacy X-RateLimit-*, and answer
// in the same { success, error } shape the controllers use
const base = {
  standardHeaders: true,
  legacyHeaders: false,
};

//Global ceiling for every /api request
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many request' },
});

//Rate limiter for authentication endpoints, allows 10 auth attemps every 15 minutes
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attemps, try again later' },
});

//Rate limit for account-registration, allows up to 5 new accounts per IP every 30 minutes
export const registerLimiter = rateLimit({
  ...base,
  windowMs: 30 * 60 * 1000,
  max: 5, //This would change, considering the case of a march
  message: { success: false, error: 'Too many accounts created' },
});

//Rate limit for case creation, allows up to 10 new cases per IP every hour
export const createCaseLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 10, //This would change, considering the case of a march
  message: {
    success: false,
    error: 'Too many cases created, try again later.',
  },
});

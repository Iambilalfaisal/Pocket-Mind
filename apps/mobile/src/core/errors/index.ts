// Base error type for every failure the app reports: a module-prefixed code plus a user message.
// Not responsible for any specific code; each module owns its own <name>.errors.ts.
export { AppError } from './AppError';

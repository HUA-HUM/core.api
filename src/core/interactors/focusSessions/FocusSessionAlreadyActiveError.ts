export class FocusSessionAlreadyActiveError extends Error {
  constructor() {
    super('user already has an active focus session');
    this.name = 'FocusSessionAlreadyActiveError';
  }
}

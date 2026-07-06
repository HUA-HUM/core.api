export class ActiveFocusSessionRequiredError extends Error {
  constructor() {
    super('An active focus session is required');
    this.name = 'ActiveFocusSessionRequiredError';
  }
}

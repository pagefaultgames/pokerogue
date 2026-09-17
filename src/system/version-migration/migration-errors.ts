export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";
  }
}

/**
 * Thrown when migration fails due to corrupt / invalid migration data.
 */
export class SessionMigrationError extends MigrationError {
  constructor(message: string) {
    super(message);
    this.name = "SessionMigrationError";
  }
}

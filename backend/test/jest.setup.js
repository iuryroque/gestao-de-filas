// Ensure all test files use an in-memory SQLite database.
// This prevents state from leaking across test runs via the on-disk dev.sqlite3 file.
process.env.SQLITE_FILE = ':memory:';

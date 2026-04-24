// Vitest setup file
// Set dummy env vars so token helpers don't throw during import
process.env.ONEJSONFILE_TASKS_TOKEN = 'test-tasks-token'
process.env.ONEJSONFILE_USERS_TOKEN = 'test-users-token'
process.env.ONEJSONFILE_SESSIONS_TOKEN = 'test-sessions-token'
process.env.ONEJSONFILE_AUTH_TOKEN = 'test-auth-token'
process.env.NODE_ENV = 'test'

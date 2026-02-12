# TODO: Switch to SQLite Database

## Steps to Complete

- [x] Install sqlite3 package in backend
- [x] Update backend/package.json to include sqlite3 dependency
- [x] Update backend/server.js to use SQLite database instead of JSON files
  - [x] Import sqlite3 and initialize database
  - [x] Create database tables for students and attendance
  - [x] Migrate existing JSON data to database on startup
  - [x] Replace JSON read/write functions with database queries
  - [x] Update all API routes to use database operations
- [x] Test server startup and API endpoints
- [ ] Verify data migration and frontend integration

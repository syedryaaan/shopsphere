# ShopSphere - Antigravity Agent Guidelines & Project Rules

## Architecture Overview
- **Client**: React 18 (SPA) bundled with Vite 5. Uses React Router DOM v6 and Axios for API communication.
- **Server**: Node.js REST API with Express 4, Mongoose 8 (MongoDB), JWT auth (`jsonwebtoken`), password hashing (`bcryptjs`), and ES Modules (`"type": "module"`).

## Coding Standards & Conventions
1. **Modules**: Use ES Module (`import` / `export`) syntax across both client and server codebases.
2. **Formatting**: 2 spaces indentation, trailing newline, no unnecessary trailing whitespaces.
3. **Client (`/client`)**:
   - Functional React components with hooks.
   - Clean state management and modular components under `src/components/`, `src/pages/`, etc.
4. **Server (`/server`)**:
   - MVC architecture: routes (`src/routes/`), controllers (`src/controllers/`), models (`src/models/`), middleware (`src/middleware/`).
   - Use async/await with consistent try/catch or async handler wrappers.
   - Return clean JSON responses with standard status codes.
5. **Environment Configuration**:
   - Always reference `.env` variables via `process.env` on the server and `import.meta.env` on Vite client.
   - Keep `.env.example` up to date whenever new configuration variables are introduced.

## Dev & Build Commands
- **Client**: `npm run dev` (port 5173), `npm run build`
- **Server**: `npm run dev` (runs nodemon on port 5000), `npm run start`, `npm run seed`

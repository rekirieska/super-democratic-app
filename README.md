# Brotherhood Support Program — Super-Earth

**Automated citizen motivation and control system for Managed Democracy.**

[![Version](https://img.shields.io/badge/version-2.0-yellow)](https://github.com/super-earth/brotherhood-support/releases)
[![Electron](https://img.shields.io/badge/Electron-42.2.0-blue)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Desktop application for task tracking, productivity monitoring, and ideological compliance. User interface designed in Helldivers 2 military‑aesthetic with CRT scanlines and yellow accents.

---

## Installation

### Prerequisites
- Node.js 22.12 or higher
- npm (included with Node.js)

### Setup
```bash
npm install
```

### Development
```bash
npm start
```

### Build executable (Linux)
```bash
npm run pack
```
Output directory: `dist/`

---

## Features

### Roles
- **Citizen** – create, complete, and delete own tasks; view personal statistics.
- **Administrator** – manage all users, tasks, roles, and issue Democratic Officer calls.

### Tasks (Directives)
- Create, edit, delete tasks.
- Priority levels 1‑5 and optional deadline.
- Automatic daily task assignment (morning only, up to 5 tasks).
- Failure or overdue tasks are **deleted** (not marked as completed).
- Starting a task launches a countdown timer (45 minutes or until deadline) with success and failure buttons.

### Statistics
- Completed tasks count.
- Productivity index (percentage of completed tasks).
- Loyalty status: "Exemplary Citizen", "In Service", "Under Surveillance".

### Interface
- Dark theme by default (Helldivers 2 style).
- Light theme (Gruvbox) – toggle in settings.
- Zoom scaling (80%‑200%).
- CRT scanline effect, pulsing alarm indicators.

### Security
- Passwords hashed with scrypt.
- Account lockout after 3 failed login attempts (30 seconds).
- Action logging (login, task CRUD, permission violations).
- Role‑based access control – citizens only access their own tasks.

### Export
- Export all tasks to CSV file.

---

## Technology Stack

| Component       | Technology                          |
|----------------|-------------------------------------|
| Frontend       | HTML5, CSS3 (variables, flexbox), vanilla JavaScript |
| Backend        | Electron (main process), IPC        |
| Data storage   | JSON files (users, tasks, roles, logs) |
| Cryptography   | Node.js crypto (scrypt)             |
| Build tools    | @electron/packager, electron-builder |

---

## Project Structure

```
.
├── main.js           # Electron main process, IPC handlers
├── preload.js        # Secure bridge between renderer and main
├── storage.js        | JSON file operations, password hashing
├── index.html        # All screens, styles, client‑side logic
├── package.json      # Dependencies and scripts
└── README.md
```

User data is stored in Electron’s `userData` directory:
- `%APPDATA%/brotherhood-support/data/` (Windows)
- `~/.config/brotherhood-support/data/` (Linux)
- `~/Library/Application Support/brotherhood-support/data/` (macOS)

---

## Usage

### First Launch
- Default administrator account:
  - **Username:** `admin`
  - **Password:** `Admin123!`
- Change password by editing `users.json` (password change UI not implemented yet).

### Screens
1. **Dashboard** – task list with checkboxes. Click on an incomplete task to open the action screen.
2. **Action Screen** – countdown timer, "Report Duty Fulfilled" and "Admit Laziness" buttons.
3. **Alarm Screen** – appears after task failure or when no active tasks exist. Allows manual task entry or random task request from HQ.
4. **Task Management** – table view of all tasks (search, edit, delete).
5. **Statistics** – completed tasks count and productivity index.
6. **User Management** (admin only) – role assignment, user deletion, Democratic Officer summoning.
7. **Settings** – theme, zoom, logout.

---

## Testing Checklist

- Authentication with lockout after 3 failures.
- Create, edit, delete tasks.
- Deadline overdue → task deleted automatically.
- Failure (laziness button) → task deleted (not completed).
- Theme and zoom switching.
- Action screen timer behaviour.
- CSV export.

---

## Contributing

Pull requests and issue reports are welcome. Please follow ES6 code style, use descriptive variable names, and comment complex logic.

---

## License

MIT License  
Copyright (c) Super-Earth Ministry of Technology

For Democracy. For Super-Earth.

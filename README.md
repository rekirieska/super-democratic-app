# Brotherhood Support Program — Super-Earth

**Desktop application for citizen motivation and control in the spirit of Managed Democracy.**
Implements authentication, role‑based access, full CRUD for subject‑domain entities, logging, export, dark theme, and data validation.

[![Version](https://img.shields.io/badge/version-2.0-yellow)](https://github.com/super-earth/brotherhood-support/releases)
[![Electron](https://img.shields.io/badge/Electron-42.2.0-blue)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Features

### Authentication
- Login window with username and password.
- Password verification against stored hash (scrypt).
- After three consecutive failed attempts, account lockout for 30 seconds.
- Logout button on main screen with confirmation dialog.

### Registration
- Registration form with fields: username, password, password confirmation, email, rank (subject‑specific field).
- Password requirements: minimum 8 characters, at least one uppercase letter, one digit, and one special character.
- New user is saved to the database and can immediately log in.

### Role Model
- Two roles: Administrator and Citizen.
- Administrator can view, create, edit, and delete all records (tasks, users, missions, weapons).
- Citizen can view and modify only their own data.
- Roles stored in a separate entity (`roles.json`) and linked to users via foreign key (`roleId`).

### Main Screen
- Personalized greeting with username.
- Navigation menu to access different sections.
- Summary information: number of tasks, completed tasks count, productivity percentage, loyalty status.
- Logout button with confirmation dialog.

### CRUD for Subject‑Domain Entities
Three core entities are implemented:
1. **Tasks** – directives for citizens.
2. **Missions** (administrative backbone).
3. **Weapons** (placeholder, can be extended).

For each entity:
- Table view of all records.
- Buttons: Add, Edit, Delete.
- Delete confirmation dialog with the exact required message: *“Вы действительно хотите удалить запись “X”? Это действие нельзя отменить, и все ваши котики умрут от грусти.”*
- Create/Edit form with field validation:
  - All fields: non‑empty check.
  - Numeric fields: value is a number.
  - String fields: minimum 3 characters for names.
- Filtering and search (search by task name on Tasks screen).

### Additional Requirements

#### Logging
All user actions are logged to `logs/actions.log` in the user data directory.  
Log format:
```
[YYYY-MM-DD HH:MM:SS] [username] [role] [ACTION] [RESULT]
```
Example:
```
[2024-01-15 14:32:10] [admin] [admin] [LOGIN] [SUCCESS]
[2024-01-15 14:35:22] [vasya] [user] [CREATE_TASK] [SUCCESS]
```

#### Export to CSV
At least one entity (Tasks) can be exported to CSV. The Export button is available on the Task Management screen.

#### Dark Theme
- Settings screen includes a checkbox “Light theme (Gruvbox)”.
- Toggling the switch changes the entire application’s colour scheme.
- The preference is saved per user and restored across sessions (`darkMode` field in `users.json`).

#### Uniqueness Validation
When creating or editing a task, the system checks that no other task with the same name exists **for the same user**. If a duplicate is detected, an error message is displayed in red under the input field.

#### Validation Notes
- All form fields are validated before submission; empty or invalid data prevents saving.

---

## Technology Stack

| Component       | Technology                          |
|----------------|-------------------------------------|
| Frontend       | HTML5, CSS3 (CSS variables, flexbox), vanilla JavaScript |
| Backend        | Electron (main process), IPC        |
| Data storage   | JSON files (users.json, tasks.json, missions.json, weapons.json, roles.json) |
| Logging        | Append to text file (`logs/actions.log`) |
| Cryptography   | Node.js crypto (scrypt)             |
| Build tools    | @electron/packager, electron-builder |

---

## Installation and Running

### Prerequisites
- Node.js 22.12 or higher
- npm

### Setup
```bash
npm install
```

### Development
```bash
npm start
```

### Build Executable (Linux)
```bash
npm run pack
```
Output directory: `dist/`

### First Launch
- Default administrator account:
  - Username: `admin`
  - Password: `Admin123!`
- The administrator has full access to all data.

---

## Project Structure

```
.
├── main.js           # Electron main process, IPC handlers
├── preload.js        # Secure bridge between renderer and main
├── storage.js        # JSON file operations, password hashing, logging
├── index.html        # All screens, styles, client‑side logic
├── package.json      # Dependencies and scripts
└── README.md
```

User data and logs are stored in Electron’s `userData` directory:
- `%APPDATA%/brotherhood-support/data/` (Windows)
- `~/.config/brotherhood-support/data/` (Linux)
- `~/Library/Application Support/brotherhood-support/data/` (macOS)

---

## Testing Checklist

- Application starts without crashes.
- New user can register (username, email, valid password).
- Existing user can log in.
- After 3 failed login attempts, account locks for 30 seconds.
- Administrator sees all records; citizen sees only own tasks.
- Create, edit, delete work for all entities.
- Delete confirmation shows the exact required message.
- Empty or invalid fields prevent saving and show error messages.
- Log file contains records of user actions.
- Export to CSV works.
- Dark theme toggles and persists.

---

## License

MIT License  
Copyright (c) Super-Earth Ministry of Technology

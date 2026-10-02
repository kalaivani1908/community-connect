# Community Event and Volunteer Coordination Platform

A complete college-level full-stack project using only the stack specified for the project:
- HTML5
- CSS3
- JavaScript
- React.js
- Bootstrap
- Node.js
- Express.js
- MySQL
- VS Code

## Roles are intentionally separated

### Organization / Admin
- Organization-only dashboard
- Create and publish events
- Add role-based volunteer slots
- View pending signups
- Approve/reject volunteer requests
- Mark attendance and manage participation
- View event turnout and volunteer impact metrics
- View complaints, rewards and misbehavior records
- Generate certificates for eligible completed participation
- Send event notifications

### Volunteer
- Volunteer-only dashboard
- Browse published events
- View role slots and availability
- Sign up for roles
- View approval status
- Check in and check out
- View participation hours/history
- View notifications
- View certificates
- Maintain profile and availability

## Important
The project is served by Express, so there is no separate frontend server to start.

## Setup

1. Install Node.js LTS.
2. Make sure MySQL Server 8.0 is running.
3. Open MySQL Workbench and run `backend/database/schema.sql`.
4. Create `backend/.env` from `.env.example` and put your MySQL password in it.
5. Open CMD in `backend`.
6. Run:
   ```
   npm install
   npm start
   ```
7. Open:
   `http://localhost:5000`

## Demo accounts

Organization:
- Email: admin@community.org
- Password: admin123

Volunteer:
- Email: volunteer@community.org
- Password: volunteer123

## Notes
This project uses a small built-in session store and Node's built-in crypto module, so no JWT, MongoDB, Firebase, QR package, or other extra framework is required.

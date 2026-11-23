# Barangay Information & Resident Management System

A fully functional, client-side barangay records system built with plain HTML, CSS and JavaScript.
All data lives in **localStorage** — no server, no accounts system, no build step required.

## What it does

- **Resident information registration & records** — full profile record, search, filters and paginated table.
- **Barangay clearance & certificate issuance** — auto-generated reference numbers, fees from the barangay profile, release tracking, print-ready document sheets.
- **Complaint and incident reporting module** — case numbers, narrative, hearing schedule and status workflow with resolution notes.
- **User login & admin access control** — login screen, admin/staff roles, password reset, account activation.
- **Search, update and generate reports** — population-by-purok, age groups, documents by type, complaint status, export to CSV or printable reports.

## Running it

No dependencies are required. Open `index.html` in a browser directly, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

For a hot-reload dev server with Node tooling:

```sh
npm install
npm run dev
```

## First login

The system ships with two demo accounts:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Administrator |
| `staff` | `staff123` | Barangay staff |

## Notes

- Everything is stored in the browser's localStorage. Clearing the browser data clears everything.
- Export backups anytime from **Settings &rarr; Data &amp; backup**.
- There is no server and no account provisioning; the number of records is limited by browser storage capacity.

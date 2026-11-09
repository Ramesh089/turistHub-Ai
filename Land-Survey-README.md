# Land Survey Analyzer

A PHP and MySQL web application for managing land survey work. It provides role-based dashboards for administrators, surveyors, government officials, and public users. Surveyors can enter land records and map coordinates, attach PDFs and photos, and submit records for review. Officials can approve or reject submissions, while users can search approved records and view their mapped locations.

## Features

- Login and registration pages with role-based routing for `admin`, `official`, `surveyor`, and `user` roles.
- Admin tools for managing user accounts and roles, viewing system totals, and maintaining project tasks.
- Survey job scheduling and survey submission, including owner, survey number, land type and area, district/taluk/village, pincode, coordinates, date, description, PDF, and photo.
- Review workflow that tracks survey status (`Pending`, `Approved`, or `Rejected`) and supports resubmission of rejected surveys.
- Search and display of approved survey records, with Leaflet maps and links to uploaded documents.
- Scheduler, task status, performance, and report pages.

## Technology

- PHP (uses `mysqli`)
- MySQL/MariaDB
- Apache (XAMPP is suitable for local development)
- HTML, CSS, JavaScript
- Leaflet maps with OpenStreetMap tiles

## Project layout

```text
land/
├── auth/                   # Login, signup, registration, password reset, logout
├── dashboards/             # Role dashboards, survey workflow, reports and schedulers
│   └── uploads/
│       ├── pdfs/           # Uploaded survey/ownership PDFs
│       └── photos/         # Uploaded survey photos
├── db/
│   └── db_config.php       # MySQL connection used by many dashboard pages
├── db_config.php           # Empty placeholder in the supplied project
└── README.md
```

## Run locally with XAMPP

1. Copy the project folder into XAMPP's `htdocs` directory. For the supplied path, it is `C:\xampp\htdocs\land`.
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Create a MySQL database named `survey_db` in phpMyAdmin.
4. Import or create the tables required by the application. The project does not include a schema or SQL seed file. The code expects at least `users`, `surveys`, `survey_jobs`, and `project_tasks`; the columns are referenced throughout the PHP pages.
5. Check the connection settings in `db/db_config.php` and `auth/db_config.php`. The supplied settings use host `localhost`, user `root`, an empty password, and database `survey_db`. Change these values to match your local MySQL setup.
6. Open `http://localhost/land/auth/login.php` in a browser.

Uploaded PDFs and photos are stored under `dashboards/uploads/pdfs/` and `dashboards/uploads/photos/`. Ensure the Apache/PHP process can write to these directories.

## Important setup notes

- The code has inconsistent database configuration: most pages connect to `survey_db`, but `auth/signup.php` connects to a database named `land_survey`. Update it to use the same configured database before using signup, or create/configure the intended database consistently.
- Several pages connect directly to MySQL instead of including the shared config. If credentials or the database name change, update those connections too.
- `db_config.php` at the project root is empty; the populated connection files are `db/db_config.php` and `auth/db_config.php`.
- No schema dump, migrations, or seed data are included. The app cannot run against a fresh database until its tables are created.
- Some older/alternate pages use different field names and database assumptions. Use the login and dashboard workflow as the main entry point.
- The login page inserts a default admin account when no admin exists. Its initial login ID is `a0001` and the initial password is `123`; change this immediately in a local or production environment.
- Leaflet and icon/font assets are loaded from external CDNs, and map tiles come from OpenStreetMap, so those parts need internet access in the browser.

## Syntax report

The supplied `php_syntax_report.txt` lists the PHP files scanned. It does not include a database schema or application-level verification. A clean syntax scan alone does not confirm that database tables, credentials, role flows, or uploads are configured correctly.

## Security and deployment

This project appears intended for local/XAMPP use. Before exposing it to a network or deploying it, review authentication and authorization on every page, password reset controls, upload validation and access, session handling, error display, and any direct SQL queries. Set strong database credentials and disable public error display in production.

# Academic Study Planner

A database-driven web application for managing academic assessments, study sessions, tasks, and student progress.

Developed for SOFE 3700U — Fall 2026.

## Technologies

- Node.js
- Express.js
- PostgreSQL 16
- JavaScript, HTML, and CSS
- Chart.js for data visualization
- PDFKit for PDF exports
- Express Session and PostgreSQL session storage

## Features

- Secure login and logout
- Admin, user, and guest roles
- Student-specific access controls
- Assessment creation, viewing, editing, and deletion
- Assessment validation and prerequisite tracking
- Study progress and assessment reports
- Ten SQL views for academic analytics
- Interactive charts and filtered reports
- CSV and PDF assessment exports
- Canadian public holiday integration
- Admin-only holiday synchronization
- Read-only guest dashboard

## Project Files

- index.js — Main Express application
- assessment-crud.js — Assessment CRUD API
- assessment-exports.js — CSV and PDF exports
- manage-assessments.js — Assessment management page
- holiday-api.js — Holiday API and database integration
- holidays-page.js — Holiday page
- public/ — Browser-side JavaScript and other static assets
- create-account.js — Account creation utility
- database_schema.sql — PostgreSQL database schema
- sample_data.sql — Demonstration data
- phase2_views.sql — SQL analytics views
- phase3_accounts.sql — Account-related database changes
- phase3_guest_role.sql — Guest role support
- phase3_holidays.sql — Holiday-related database changes

## Requirements

Install:

1. Node.js and npm
2. PostgreSQL 16
3. Git

## Installation

### 1. Clone the repository

git clone https://github.com/Ri60/academic-study-planner.git

cd academic-study-planner

### 2. Install dependencies

npm install

### 3. Configure environment variables

Copy .env.example to .env.

On Windows PowerShell:

Copy-Item .env.example .env

Edit .env and replace the placeholder values with your local PostgreSQL credentials and a long, random SESSION_SECRET.

Never commit .env to Git.

### 4. Create the PostgreSQL database

Using PostgreSQL's psql command-line utility:

CREATE DATABASE academic_study_planner;

Connect to the new database and execute the SQL files in this order:

1. database_schema.sql
2. sample_data.sql

The schema export already includes the tables, views, constraints, and role definitions. The phase2 and phase3 SQL files document earlier development stages and should not be reapplied after database_schema.sql.

The sample data contains demonstration students, courses, assessments, study sessions, and tasks. Account passwords are not included.

### 5. Create a login account

Run:

node create-account.js

Enter a username, role, and password when prompted.

Available roles:

- admin — Administrative access
- user — Access to the associated student's data
- guest — Read-only access to permitted public information

For a user account, enter an existing student ID such as S001.

Passwords must contain at least 12 characters. The utility stores scrypt password hashes rather than plaintext passwords.

### 6. Start the application

npm start

Open the local URL displayed by the application in your browser.

## Main Pages

- /login — Login page
- / — Dashboard
- /manage-assessments — Assessment management
- /study-progress — Study progress analytics
- /assessment-reports — Assessment reports
- /holidays — Canadian public holidays
- /guest — Guest dashboard

## API Endpoints

- GET /api/assessments — List permitted assessments
- POST /api/assessments — Create an assessment
- PUT /api/assessments/:id — Update an assessment
- DELETE /api/assessments/:id — Delete an assessment
- GET /api/assessments/export/csv — Export CSV
- GET /api/assessments/export/pdf — Export PDF
- GET /api/holidays — Retrieve holidays

Assessment operations enforce authentication, role permissions, and student ownership restrictions.

## Database Design

The five core academic tables are:

- student
- course
- assessment
- task
- studysession

Additional tables support authentication and Canadian public holidays.

The database includes ten analytical SQL views used by the application to present academic progress, assessment priorities, task completion, study time, and upcoming deadlines.

## Security

- Passwords are verified using scrypt
- PostgreSQL queries use parameterized values
- Session-based authentication
- Role-based authorization
- Student ownership checks
- Guests cannot access private assessments or export private assessment data
- Secrets are stored in .env, which is excluded from Git

## Repository

https://github.com/Ri60/academic-study-planner

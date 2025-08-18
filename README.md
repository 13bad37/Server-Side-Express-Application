# Server-Side Express Application — Movie API

![Node.js](https://img.shields.io/badge/Node.js-v18.x-green) ![Express](https://img.shields.io/badge/Express-v4.x-blue) ![MySQL](https://img.shields.io/badge/MySQL-v8.x-orange) ![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-brightgreen)

A secure, database-driven movie API built with Node.js, Express, and MySQL. This project was developed to test my capabilities with backend technologies and to improve my understanding of Node.js, Express, and MySQL. It features robust authentication, HTTPS encryption, and comprehensive API documentation.

---

## Features

- **User Authentication**
  - Register, login, logout, and refresh tokens
  - Short-lived bearer tokens and persistent refresh tokens
  - Password hashing with `bcryptjs`

- **User Profiles**
  - View and update profiles with field validation

- **Movie Metadata API**
  - Search movies by title and year
  - View detailed metadata and principal credits
  - Pagination and filtering support

- **API Documentation**
  - Auto-generated Swagger UI from `openapi.json`

- **MySQL Integration**
  - Structured schema with migrations and seed data
  - Advanced JOIN logic for metadata and people

- **HTTPS Support**
  - Self-signed certificate for encrypted connections

- **Persistent Hosting**
  - Auto-restarts on crash or reboot using `pm2`

---

## Technologies Used

- Node.js / Express.js
- Knex.js (SQL query builder)
- MySQL (relational database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- pm2 (process manager)
- Swagger UI (API documentation)
- dotenv (environment configuration)

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/13bad37/Server-Side-Express-Application.git
cd Server-Side-Express-Application
```

### Setup Environment Variables

Create a `.env` file in the root directory with the following:

```env
PORT=3000
JWT_SECRET=yourStrongRandomSecret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Cab230!
DB_NAME=movies
DB_PORT=3306
```

### Install Dependencies

```bash
npm install
```

### Run the Server Locally

```bash
node src/index.js
```


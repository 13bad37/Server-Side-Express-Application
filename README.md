# 🎬 Server-Side Express Application — Movie API

This repository contains the full backend implementation of a secure, database-driven movie API developed for the **CAB230 Web Programming** unit at **Queensland University of Technology (QUT)**.

It is a RESTful API server built with **Node.js**, **Express**, and **MySQL**, implementing **JWT authentication**, **HTTPS encryption**, **Swagger documentation**, and **pm2-based deployment** to a live **Azure VM**.

> ✅ Production-ready features | 🔒 Secure authentication | ☁️ Fully deployed

---

## 🚀 Features

- 🔐 **Secure User Authentication**  
  - Register, login, logout, refresh tokens  
  - Short-lived bearer tokens & persistent refresh tokens  
  - Hashed passwords using `bcryptjs`

- 👤 **User Profiles**  
  - Authenticated profile viewing and updating  
  - Optional/required field validation with proper error messaging  

- 🎞️ **Movie Metadata API**  
  - Search movies by title and year  
  - View detailed metadata and principal credits  
  - Pagination and filtering support  

- 📃 **API Documentation**  
  - Swagger UI auto-generated from `openapi.json`  
  - Accessible via the root URL `/`

- 🐬 **MySQL Integration via Knex**  
  - Structured schema with proper migrations and seed data  
  - Full JOIN logic across tables for metadata and people

- 🛡️ **HTTPS Support**  
  - Self-signed certificate for encrypted connections  

- ♻️ **Persistent Hosting with pm2**  
  - Application auto-restarts on crash or reboot  
  - pm2 startup registered on Azure VM

---

## 🧰 Technologies Used

- **Node.js** / **Express.js**
- **Knex.js** (SQL query builder)
- **MySQL** (relational database)
- **bcryptjs** (password hashing)
- **jsonwebtoken** (JWT auth)
- **pm2** (background process manager)
- **Swagger UI** (API docs)
- **dotenv** (env config)

---

## 🛠️ Getting Started (Local Development)

### 📦 Clone the Repository

```bash
git clone https://github.com/13bad37/Server-Side-Express-Application.git
cd Server-Side-Express-Application
```

### 📁 Setup Environment Variables
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

### 🧪 Install Dependencies

```bash
npm install
```
### ▶️ Run the Server (Locally)

```bash
node src/index.js
```


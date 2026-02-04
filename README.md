# IsraTube 📺🎵

![IsraTube Banner](assets/banner.png)

---

## 📖 Table of Contents
- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Testing](#testing)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## 🎬 About

IsraTube is a modern entertainment platform designed to provide users with access to movies, TV channels, and songs. It combines ease of use with enterprise-grade security, offering both content browsing and user-generated uploads.

### What IsraTube Offers

**For Users:**
- Browse and discover movies, TV shows, and music  
- Upload and share your own content  
- Quick and efficient search  
- Fully responsive design (phones, computers, TVs)  
- Dark mode for comfortable viewing  
- Affordable subscription: $5/month with a 30-day free trial  

**For Administrators:**
- Complete user management system  
- Content moderation tools  
- File upload monitoring  
- System configuration and analytics  

**Why IsraTube?**
- **Security First** – Enterprise-grade security  
- **User Experience** – Intuitive interface on all devices  
- **Community Driven** – Users can contribute content  

---

## ✨ Features

### Core Functionality
- 🎬 **Media Library** – Movies, TV channels, and music  
- 📤 **User Uploads** – Upload and share content  
- 🔍 **Smart Search** – Quickly find content  
- 📱 **Responsive Design** – Mobile, tablet, desktop, and TV  
- 🌙 **Dark Mode** – Toggle light/dark themes  
- 💰 **Free Trial** – 30-day free trial before $5/month  

### Security Features
- 🔐 Argon2 Password Hashing  
- 🛡️ CSRF Protection  
- 🚫 SSRF Protection  
- 📁 Advanced File Validation  
- 🔒 Account Lockout  
- ⚡ Rate Limiting  
- 🔑 Role-Based Access Control  

### User Management
- 👤 User Registration & Verification  
- 🔑 Secure Authentication  
- 📊 User Profiles  
- 👥 Admin Dashboard for CRUD operations  

### File Management
- 📤 Single & Batch Upload  
- 📥 File Download  
- 🗑️ File Deletion  
- 📋 File Listing  

---

## 🛠️ Tech Stack

**Backend:**  
- Node.js (v20.x)  
- Express.js (v5.x)  
- MongoDB (v7.x)  
- Mongoose (v8.x)  

**Security & Authentication:**  
- Argon2, express-rate-limit, cookie-parser, crypto  

**File Handling:**  
- Multer, file-type, uuid  

**Email & Communication:**  
- Nodemailer  

**Development & Documentation:**  
- Swagger UI Express, swagger-jsdoc, nodemon, Docker, LocalStack  

**Cloud Services:**  
- AWS SDK, AWS Secrets Manager  

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+  
- MongoDB v7+  
- npm or yarn  
- Git  

### Installation

```bash
git clone https://github.com/yourusername/isratube.git
cd isratube
npm install
Environment Variables
Create .env in server/:

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Admin Credentials
USER_ADMIN=admin@admin
PASSWORD_ADMIN=admin

# Server
PORT=3000
NODE_ENV=development

# SSRF Protection
TRUSTED_DOMAINS=www.pexels.com,www.istockphoto.com,images.unsplash.com
MAX_UPLOAD_BYTES=10485760

# File Upload
UPLOAD_DIR=uploads/
TEMP_DIR=temp/
MAX_FILE_SIZE=10485760
MAX_REQUEST_SIZE=31457280
MAX_FILES_PER_REQUEST=3
Start Server

Development:

npm run dev
Production:

npm start
Access the App:

Frontend: http://localhost:3000

Admin Panel: http://localhost:3000/admin.html

Homepage: http://localhost:3000/homepage.html

API Docs: http://localhost:3000/api-docs

First-Time Setup
Create the first admin account:

curl -X POST http://localhost:3000/setup \
-H "Content-Type: application/json" \
-d '{"email":"admin@isratube.com","password":"AdminPass123!"}'
🐳 Docker Deployment
Quick Start
docker-compose up -d
docker-compose logs -f
docker-compose down
docker-compose down -v
docker-compose up -d --build
Direct Docker
docker build -t isratube:latest .
docker run -d -p 3000:3000 -e MONGO_URI=your-mongo-uri -e GMAIL_USER=your-email -e GMAIL_PASS=your-password --name isratube-app isratube:latest
docker logs -f isratube-app
docker stop isratube-app
📡 API Documentation
Interactive Swagger UI:
http://localhost:3000/api-docs

Endpoints:

Authentication: /setup, /signup, /login

User Management: /api/users (CRUD)

File Upload: /api/upload/single, /api/upload/multiple

Download: /api/upload/download/:fileId

Security: CSRF, SSRF, Argon2 password hashing, Rate limiting

🔐 Security Features
Password Security – Argon2 hashing, strong password rules

CSRF Protection – Double-submit cookie pattern

SSRF Protection – Trusted domains only, HTTPS enforcement

File Validation – Magic byte & extension checks, size limits

Account Security – Lockout on failed attempts, secure sessions

Rate Limiting – Protect API endpoints

Input Validation – Filenames, email, and array limits

🧪 Testing
Manual Testing: Authentication, File Uploads, CSRF, SSRF, Rate Limiting, User & File Management

Automated Testing: Jest + Supertest

npm install --save-dev jest supertest
npm test
⚙️ Configuration
Environment Variables: MONGO_URI, GMAIL_USER, GMAIL_PASS, USER_ADMIN, PASSWORD_ADMIN, PORT, NODE_ENV, TRUSTED_DOMAINS, UPLOAD_DIR, TEMP_DIR, MAX_FILE_SIZE, MAX_REQUEST_SIZE, MAX_FILES_PER_REQUEST

Allowed File Types:
| Type  | Extensions  | MIME Type       | Max Size |
|-------|------------|----------------|----------|
| PDF   | .pdf       | application/pdf| 10MB     |
| JPEG  | .jpg, .jpeg| image/jpeg     | 10MB     |
| PNG   | .png       | image/png      | 10MB     |
| GIF   | .gif       | image/gif      | 10MB     |
| Text  | .txt       | text/plain     | 10MB     |
| ZIP   | .zip       | application/zip| 10MB     |


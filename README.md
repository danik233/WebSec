📖 Table of Contents
About
Features
Tech Stack
Getting Started
Docker Deployment
API Documentation
Security Features
Testing
Configuration
Contributing
License
🎬 AboutIsraTube is a modern entertainment platform designed to provide users with access to a wide selection of movies, TV channels, and songs. The platform combines ease of use with enterprise-grade security, offering both content browsing and user-generated uploads.What IsraTube OffersFor Users:

Browse and discover movies, TV shows, and music
Upload and share your own content with the community
Quick and efficient search to find your favorite content
Fully responsive design that works seamlessly on phones, computers, and TVs
Dark mode for comfortable viewing
Affordable pricing at just $5/month with a 30-day free trial
For Administrators:

Complete user management system
Content moderation tools
File upload monitoring and control
System configuration and analytics
Why IsraTube?IsraTube was built with three core principles:

Security First - Enterprise-grade security measures protect both users and content
User Experience - Intuitive interface that works across all devices
Community Driven - Users can contribute and share content
✨ FeaturesCore Functionality

🎬 Media Library - Extensive collection of movies, TV channels, and music
📤 User Uploads - Every registered user can upload and share content
🔍 Smart Search - Powerful search engine to find content quickly
📱 Responsive Design - Perfect experience on mobile, tablet, desktop, and TV
🌙 Dark Mode - Toggle between light and dark themes
💰 Free Trial - 30-day free trial before $5/month subscription
Security Features

🔐 Argon2 Password Hashing - Military-grade password encryption
🛡️ CSRF Protection - Protection against cross-site request forgery
🚫 SSRF Protection - Secure image fetching from trusted domains only
📁 Advanced File Validation - Magic byte verification and extension checking
🔒 Account Lockout - Automatic lockout after failed login attempts
⚡ Rate Limiting - API abuse prevention
🔑 Role-Based Access Control - Admin and user permission levels
User Management

👤 User Registration - Simple signup with email verification
🔑 Secure Authentication - Login with encrypted credentials
📊 User Profiles - Manage favorite content and preferences
👥 Admin Dashboard - Complete CRUD operations for user management
File Management

📤 Single File Upload - Upload one file at a time
📦 Batch Upload - Upload up to 3 files simultaneously
📥 File Download - Secure file retrieval
🗑️ File Deletion - Remove uploaded content
📋 File Listing - Browse all public files
🛠️ Tech StackBackend

Node.js (v20.x) - JavaScript runtime environment
Express.js (v5.x) - Fast, unopinionated web framework
MongoDB (v7.x) - NoSQL database for flexible data storage
Mongoose (v8.x) - Elegant MongoDB object modeling
Security & Authentication

Argon2 - Password hashing algorithm (OWASP recommended)
express-rate-limit - Rate limiting middleware
cookie-parser - Parse HTTP cookies
crypto - Cryptographic functionality for CSRF tokens
File Handling

Multer - Middleware for handling multipart/form-data
file-type - Detect file type from buffer (magic bytes)
uuid - Generate unique filenames
Email & Communication

Nodemailer - Send emails for user notifications
Development & Documentation

Swagger UI Express - Interactive API documentation
swagger-jsdoc - Generate Swagger specs from JSDoc
nodemon - Auto-restart on file changes
Docker - Containerization platform
LocalStack - AWS services emulation for local development
Cloud Services

AWS SDK - Integration with AWS services
AWS Secrets Manager - Secure secret storage (via LocalStack)
🚀 Getting StartedPrerequisitesBefore you begin, ensure you have the following installed:

Node.js (v20 or higher)
MongoDB (v7 or higher)
npm or yarn
Git

Installation

Clone the repository

bash   git clone https://github.com/yourusername/isratube.git
   cd isratube

Install dependencies

bash   npm install

Set up environment variables
Create a .env file in the server directory with the following content:

env   # Database Configuration
   MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/

   # Email Configuration (Gmail)
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-app-password

   # Admin Credentials
   USER_ADMIN=admin@admin
   PASSWORD_ADMIN=admin

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # SSRF Protection - Trusted Domains
   TRUSTED_DOMAINS=www.pexels.com,www.istockphoto.com,images.unsplash.com
   MAX_UPLOAD_BYTES=10485760

   # File Upload Configuration
   UPLOAD_DIR=uploads/
   TEMP_DIR=temp/
   MAX_FILE_SIZE=10485760
   MAX_REQUEST_SIZE=31457280
   MAX_FILES_PER_REQUEST=3
Note: For Gmail, you need to generate an App Password instead of using your regular password.

Start the server
Development mode (with auto-reload):

bash   npm run dev
Production mode:
bash   npm start

Access the application

Frontend: http://localhost:3000
Admin Panel: http://localhost:3000/admin.html
Homepage: http://localhost:3000/homepage.html
API Documentation: http://localhost:3000/api-docs



First-Time Setup

Create the first admin account using the /setup endpoint:

bash   curl -X POST http://localhost:3000/setup \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@isratube.com","password":"AdminPass123!"}'
Or use a tool like Postman/Insomnia to send the POST request.

Log in with your admin credentials at http://localhost:3000/admin.html

🐳 Docker Deployment
Quick Start with Docker Compose

Start all services

bash   docker-compose up -d
This will start:

Web application (port 3000)
MongoDB (port 27017)
LocalStack for AWS services (port 4566)


View logs

bash   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f web

Stop services

bash   docker-compose down

Stop and remove volumes (warning: deletes all data)

bash   docker-compose down -v

Rebuild and restart

bash   docker-compose up -d --build
Using Docker Directly

Build the image

bash   docker build -t isratube:latest .

Run the container

bash   docker run -d \
     -p 3000:3000 \
     -e MONGO_URI=your-mongo-uri \
     -e GMAIL_USER=your-email \
     -e GMAIL_PASS=your-password \
     --name isratube-app \
     isratube:latest

View container logs

bash   docker logs -f isratube-app

Stop the container

bash   docker stop isratube-app
📡 API Documentation
Authentication Endpoints
POST /setup
Create the first admin account (only works when no users exist)
Request:
json{
  "email": "admin@isratube.com",
  "password": "AdminPass123!"
}
Response:
json{
  "message": "✅ Admin account created successfully"
}

POST /signup
Create a new user account
Headers:

x-xsrf-token: CSRF token (get from XSRF-TOKEN cookie)

Request:
json{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "repeatPassword": "SecurePass123!",
  "paid": false,
  "favArray": []
}
Response:
json{
  "message": "Signup successful. Free trial 30 days."
}
Password Requirements:

Minimum 8 characters
At least one uppercase letter
At least one lowercase letter
At least one number
At least one special character (!@#$%^&*)


POST /login
Authenticate user and get role-based redirect
Headers:

x-xsrf-token: CSRF token

Request:
json{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
Response:
json{
  "role": "user",
  "message": "Login successful.",
  "redirect": "/homepage.html"
}
Security Features:

Account locks after 5 failed attempts
10-minute lockout duration
Failed attempts counter resets on successful login


User Management Endpoints
GET /api/users
Retrieve all users (Admin only)
Response:
json[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "paid": false,
    "role": "USER",
    "favArray": ["movie1", "movie2"],
    "signupDate": "2024-01-15T10:30:00.000Z",
    "failedAttempts": 0,
    "lockUntil": null
  }
]

PUT /api/users/:email
Update user information (Admin only)
Headers:

x-xsrf-token: CSRF token

Request:
json{
  "newEmail": "newemail@example.com",
  "newPassword": "NewPass123!",
  "newPaid": true,
  "newFavArray": ["movie1", "movie2", "movie3"]
}
Response:
json{
  "message": "User user@example.com updated."
}

DELETE /api/users/:email
Delete a user (Admin only)
Headers:

x-xsrf-token: CSRF token

Response:
json{
  "message": "User user@example.com deleted."
}

File Upload Endpoints
POST /api/upload/single
Upload a single file
Headers:

Content-Type: multipart/form-data
x-xsrf-token: CSRF token

Form Data:

file: File to upload

Response:
json{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "originalName": "document.pdf",
    "size": 1024576,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
Allowed File Types:

PDF: .pdf
Images: .jpg, .jpeg, .png, .gif
Text: .txt
Archives: .zip

File Size Limit: 10MB per file

POST /api/upload/multiple
Upload multiple files (max 3 per request)
Headers:

Content-Type: multipart/form-data
x-xsrf-token: CSRF token

Form Data:

files[]: Array of files to upload

Response:
json{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [
    {
      "id": "file-id-1",
      "originalName": "document1.pdf",
      "size": 1024576,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "file-id-2",
      "originalName": "image.png",
      "size": 512000,
      "mimeType": "image/png",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}

GET /api/upload/files
List all public files
Response:
json{
  "success": true,
  "count": 2,
  "files": [
    {
      "id": "file-id-1",
      "originalName": "document.pdf",
      "size": 1024576,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "downloadCount": 5,
      "isPublic": true
    }
  ]
}

GET /api/upload/download/:fileId
Download a file by ID
Response:

File download (application/octet-stream or specific MIME type)

Authorization:

Public files: accessible to everyone
Private files: only owner or admin


DELETE /api/upload/:fileId
Delete a file
Headers:

x-xsrf-token: CSRF token

Response:
json{
  "success": true,
  "message": "File deleted successfully"
}

Rate Limiting
All upload endpoints are rate-limited:

Window: 15 minutes
Max Requests: 10 per IP address
Response on limit:

json  {
    "success": false,
    "error": "Too many upload requests, please try again later",
    "retryAfter": 900
  }
```

---

### Interactive API Documentation

For interactive API testing with Swagger UI, visit:
```
http://localhost:3000/api-docs
Features:

Try out API endpoints directly
View request/response schemas
See authentication requirements
Test with different parameters

🔐 Security Features
1. Password Security
Argon2 Hashing:

Industry-standard password hashing (OWASP recommended)
Memory-hard algorithm resistant to GPU attacks
Automatic salt generation

Password Requirements:
javascript- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)
Example valid passwords:

SecurePass123!
MyP@ssw0rd
Admin#2024Pass


2. CSRF Protection
Implementation:

Double-submit cookie pattern
Token stored in XSRF-TOKEN cookie
Token must be sent in x-xsrf-token header
Validates on all POST, PUT, DELETE requests

How it works:

Server sets XSRF-TOKEN cookie on GET requests
Client reads cookie and sends value in header
Server validates cookie matches header
Request rejected if tokens don't match

Client-side example:
javascriptconst csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

fetch('/api/upload/single', {
  method: 'POST',
  headers: {
    'x-xsrf-token': csrfToken
  },
  body: formData
});

3. SSRF Protection
TrustedImageFetcher Service provides multi-layer SSRF protection:
Layer 1 - HTTPS Enforcement:

Only HTTPS URLs accepted
Rejects HTTP, FTP, file:// protocols
Rejects URLs with credentials (user:pass@host)
Only standard port 443 allowed

Layer 2 - Domain Allowlist:

Only fetch from pre-approved domains
Configurable via TRUSTED_DOMAINS environment variable
Example: www.pexels.com,images.unsplash.com

Layer 3 - DNS Resolution & IP Verification:

Resolves hostname to IPs before connecting
Blocks private IP ranges:

127.0.0.0/8 (loopback)
10.0.0.0/8 (private)
172.16.0.0/12 (private)
192.168.0.0/16 (private)
169.254.0.0/16 (link-local)
IPv6 equivalents



Layer 4 - DNS Pinning:

Uses pre-verified IPs only
Prevents TOCTOU (Time-of-Check-Time-of-Use) attacks
No additional DNS lookups during request

Layer 5 - No Redirects:

Rejects all HTTP redirects (3xx status codes)
Prevents redirect-based bypasses

Layer 6 - Content Validation:

Validates Content-Type header (must be image/*)
Enforces size limits (10MB default)
Checks Content-Length header

Usage example:
javascriptconst trustedImageFetcher = require('./services/TrustedImageFetcher');

try {
  const imageBuffer = await trustedImageFetcher
    .fetchHttpsFromTrustedDomain('https://www.pexels.com/photo/12345.jpg');
  
  // Use the image
  await saveImage(imageBuffer);
} catch (error) {
  console.error('SSRF protection blocked:', error.message);
}

4. File Upload Security
Magic Byte Validation:

Verifies actual file type using file-type library
Checks first bytes of file (file signature)
Prevents disguised malicious files

Supported types with magic bytes:
javascriptPDF:  [0x25, 0x50, 0x44, 0x46] // %PDF
JPEG: [0xFF, 0xD8, 0xFF]
PNG:  [0x89, 0x50, 0x4E, 0x47]
GIF:  [0x47, 0x49, 0x46, 0x38]
ZIP:  [0x50, 0x4B, 0x03, 0x04]
Extension Allowlist:

Only specific extensions permitted
Case-insensitive checking
Configurable in upload.config.js

File Size Limits:

Individual file: 10MB default
Total request: 30MB default
Configurable via environment variables

Secure Filename Generation:

UUID v4 for unique filenames
Original extension preserved
Prevents filename collisions
No user input in filename

Path Traversal Protection:

Resolves file paths to absolute
Verifies path is within upload directory
Rejects paths containing ../


5. Account Security
Account Lockout:

Locks account after 5 failed login attempts
10-minute lockout duration
Counter resets on successful login
Lockout timer stored in database

Failed Attempt Tracking:
javascriptfailedAttempts: Number  // Counter
lockUntil: Date         // Lockout expiration
Session Security:

CSRF tokens expire after 24 hours
Secure cookies in production
SameSite=Strict cookie policy


6. Rate Limiting
Upload Endpoint Protection:

10 requests per 15-minute window
Per IP address tracking
Standard rate limit headers
Graceful error responses

Configuration:
javascript{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // requests
  standardHeaders: true,      // RateLimit-* headers
  legacyHeaders: false        // X-RateLimit-* headers
}

7. Input Validation & Sanitization
Filename Sanitization:
javascript// Remove path traversal
sanitized = filename.replace(/\.\./g, '');

// Remove dangerous characters
sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

// Limit length
const maxLength = 200;
if (basename.length > maxLength) {
  basename = basename.substring(0, maxLength);
}
Email Validation:

Converted to lowercase
Format validation
Uniqueness check

Array Limits:

Favorite movies limited to 50 items
File uploads limited to 3 per request

🧪 Testing
Manual Testing
1. Authentication Tests
Test Admin Account Creation:
bash# Should succeed (first time only)
curl -X POST http://localhost:3000/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'

# Should fail (setup already completed)
curl -X POST http://localhost:3000/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@test.com","password":"Admin123!"}'
Test Password Validation:
bash# Should fail - password too short
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -d '{"email":"user@test.com","password":"Short1!","repeatPassword":"Short1!","paid":false}'

# Should fail - no uppercase
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -d '{"email":"user@test.com","password":"lowercase123!","repeatPassword":"lowercase123!","paid":false}'

# Should succeed
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -d '{"email":"user@test.com","password":"ValidPass123!","repeatPassword":"ValidPass123!","paid":false}'
Test Account Lockout:
bash# Attempt login 6 times with wrong password
for i in {1..6}; do
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -H "x-xsrf-token: YOUR_TOKEN" \
    -d '{"email":"user@test.com","password":"WrongPassword"}'
  echo "Attempt $i"
done

# Should return: "Account locked due to too many failed attempts"
2. File Upload Tests
Test Single File Upload:
bash# Create a test file
echo "Test content" > test.txt

# Upload the file
curl -X POST http://localhost:3000/api/upload/single \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -F "file=@test.txt"
Test File Type Validation:
bash# Create a file with wrong extension
echo "Not a PDF" > fake.pdf

# Should fail magic byte validation
curl -X POST http://localhost:3000/api/upload/single \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -F "file=@fake.pdf"
Test File Size Limit:
bash# Create a file larger than 10MB
dd if=/dev/zero of=large.txt bs=1M count=11

# Should fail - file too large
curl -X POST http://localhost:3000/api/upload/single \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -F "file=@large.txt"
Test Multiple File Upload:
bash# Create test files
echo "File 1" > file1.txt
echo "File 2" > file2.txt
echo "File 3" > file3.txt

# Upload multiple files
curl -X POST http://localhost:3000/api/upload/multiple \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -F "files=@file1.txt" \
  -F "files=@file2.txt" \
  -F "files=@file3.txt"
Test Maximum Files Limit:
bash# Create 4 files
for i in {1..4}; do echo "File $i" > file$i.txt; done

# Should fail - too many files (max 3)
curl -X POST http://localhost:3000/api/upload/multiple \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -F "files=@file1.txt" \
  -F "files=@file2.txt" \
  -F "files=@file3.txt" \
  -F "files=@file4.txt"
3. CSRF Protection Tests
Test Missing CSRF Token:
bash# Should fail - no CSRF token
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!","repeatPassword":"Pass123!","paid":false}'

# Expected: {"message":"CSRF token missing"}
Test Invalid CSRF Token:
bash# Should fail - invalid token
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: invalid-token-123" \
  -d '{"email":"user@test.com","password":"Pass123!","repeatPassword":"Pass123!","paid":false}'

# Expected: {"message":"CSRF token mismatch"}
4. Rate Limiting Tests
Test Upload Rate Limit:
bash# Upload 11 files quickly (limit is 10 per 15 minutes)
for i in {1..11}; do
  echo "Test $i" > test$i.txt
  curl -X POST http://localhost:3000/api/upload/single \
    -H "x-xsrf-token: YOUR_TOKEN" \
    -F "file=@test$i.txt"
  echo "Upload $i completed"
done

# 11th request should fail with 429 status
5. SSRF Protection Tests
Test Trusted Domain:
javascript// In Node.js or browser console
const trustedImageFetcher = require('./server/services/TrustedImageFetcher');

// Should succeed - trusted domain
trustedImageFetcher.fetchHttpsFromTrustedDomain('https://www.pexels.com/photo/example.jpg')
  .then(data => console.log('Success:', data.length, 'bytes'))
  .catch(err => console.error('Error:', err.message));
Test Untrusted Domain:
javascript// Should fail - untrusted domain
trustedImageFetcher.fetchHttpsFromTrustedDomain('https://evil.com/image.jpg')
  .catch(err => console.log('Blocked:', err.message));
// Expected: "Untrusted domain: evil.com"
Test Private IP:
javascript// Should fail - private IP
trustedImageFetcher.fetchHttpsFromTrustedDomain('https://192.168.1.1/image.jpg')
  .catch(err => console.log('Blocked:', err.message));
// Expected: "Private/reserved IP blocked: 192.168.1.1"
Test HTTP (not HTTPS):
javascript// Should fail - HTTP not allowed
trustedImageFetcher.fetchHttpsFromTrustedDomain('http://www.pexels.com/image.jpg')
  .catch(err => console.log('Blocked:', err.message));
// Expected: "Only HTTPS URLs are allowed"
6. User Management Tests
Test List Users:
bashcurl -X GET http://localhost:3000/api/users
Test Update User:
bashcurl -X PUT http://localhost:3000/api/users/user@test.com \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: YOUR_TOKEN" \
  -d '{"newPaid":true,"newFavArray":["movie1","movie2"]}'
Test Delete User:
bashcurl -X DELETE http://localhost:3000/api/users/user@test.com \
  -H "x-xsrf-token: YOUR_TOKEN"
Automated Testing
Setting Up Tests

Install testing dependencies:

bash   npm install --save-dev jest supertest

Create test file: server/__tests__/api.test.js

javascriptconst request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../modules/user');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  test('Should create admin account', async () => {
    const res = await request(app)
      .post('/setup')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain('created successfully');
  });

  test('Should reject weak password', async () => {
    const res = await request(app)
      .post('/signup')
      .send({
        email: 'user@test.com',
        password: 'weak',
        repeatPassword: 'weak',
        paid: false
      });
    
    expect(res.statusCode).toBe(400);
  });

  test('Should login successfully', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBeDefined();
  });
});

describe('File Upload Tests', () => {
  test('Should upload file successfully', async () => {
    const res = await request(app)
      .post('/api/upload/single')
      .attach('file', Buffer.from('test'), 'test.txt');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Should reject large file', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const res = await request(app)
      .post('/api/upload/single')
      .attach('file', largeBuffer, 'large.txt');
    
    expect(res.statusCode).toBe(400);
  });
});

Add test script to package.json:

json   {
     "scripts": {
       "test": "jest --coverage",
       "test:watch": "jest --watch"
     }
   }

Run tests:

bash   npm test
Testing Checklist

 Authentication

 Admin account creation
 User signup with valid password
 User signup with invalid password
 Login with correct credentials
 Login with incorrect credentials
 Account lockout after 5 failed attempts


 CSRF Protection

 POST request without CSRF token (should fail)
 POST request with invalid CSRF token (should fail)
 POST request with valid CSRF token (should succeed)
 GET request without CSRF token (should succeed)


 File Upload

 Upload valid file types
 Upload invalid file types (should fail)
 Upload file exceeding size limit (should fail)
 Upload multiple files (max 3)
 Upload more than 3 files (should fail)
 Magic byte validation for disguised files


 SSRF Protection

 Fetch from trusted domain (should succeed)
 Fetch from untrusted domain (should fail)
 Fetch using HTTP instead of HTTPS (should fail)
 Fetch from private IP address (should fail)
 Fetch from localhost (should fail)


 Rate Limiting

 Make 10 upload requests (should succeed)
 Make 11th upload request (should fail with 429)
 Wait 15 minutes and retry (should succeed)


 User Management

 List all users
 Update user information
 Delete user
 Update with duplicate email (should fail)


 File Management

 List all files
 Download public file
 Download private file without auth (should fail)
 Delete file



⚙️ Configuration
Environment Variables
VariableDescriptionDefaultRequiredMONGO_URIMongoDB connection string-✅GMAIL_USERGmail address for notifications-✅GMAIL_PASSGmail app password-✅USER_ADMINAdmin usernameadmin@admin✅PASSWORD_ADMINAdmin passwordadmin✅PORTServer port3000❌NODE_ENVEnvironment (development/production)development❌TRUSTED_DOMAINSComma-separated trusted domains for SSRF protection-✅MAX_UPLOAD_BYTESMax file size from URL (bytes)10485760 (10MB)❌MAX_FILE_SIZEMax upload file size (bytes)10485760 (10MB)❌MAX_REQUEST_SIZEMax total request size (bytes)31457280 (30MB)❌MAX_FILES_PER_REQUESTMax files per upload3❌UPLOAD_DIRDirectory for uploaded filesuploads/❌TEMP_DIRTemporary file storagetemp/❌
Allowed File Types
TypeExtensionsMIME TypesMax SizePDF.pdfapplication/pdf10MBJPEG.jpg, .jpegimage/jpeg10MBPNG.pngimage/png10MBGIF.gifimage/gif10MBText.txttext/plain10MBZIP.zipapplication/zip10MB
To modify allowed types, edit server/config/upload.config.js:
javascriptallowedTypes: {
  'pdf': { 
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]]
  },
  // Add more types here
}
Trusted Domains for SSRF Protection
Edit .env file:
envTRUSTED_DOMAINS=www.pexels.com,www.istockphoto.com,images.unsplash.com,cdn.example.com
Important: Only add domains you fully trust. This is a critical security setting.

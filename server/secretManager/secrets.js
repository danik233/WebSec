// secrets.js
const fs = require("fs");
const path = require("path");
require("dotenv").config();

let secrets = {};

// Load secrets from a local encrypted file if exists
const secretsFile = path.join(__dirname, "secrets.json");

if (fs.existsSync(secretsFile)) {
  try {
    const data = fs.readFileSync(secretsFile, "utf8");
    secrets = JSON.parse(data);
  } catch (err) {
    console.error("❌ Failed to load secrets:", err);
  }
}

// Fallback to environment variables
const getSecret = (key) => {
  return secrets[key] || process.env[key];
};

module.exports = { getSecret };

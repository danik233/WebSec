const { getSecret } = require("./secrets");

console.log("MONGO_URI:", getSecret("MONGO_URI"));
console.log("GMAIL_USER:", getSecret("GMAIL_USER"));
console.log("USER_ADMIN:", getSecret("USER_ADMIN"));
console.log("PASSWORD_ADMIN:", getSecret("PASSWORD_ADMIN"));

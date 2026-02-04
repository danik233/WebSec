// server/secretManager/awsSecrets.js
const AWS = require("aws-sdk");

// Configure to use LocalStack
const client = new AWS.SecretsManager({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  accessKeyId: "localstack",
  secretAccessKey: "localstack",
});

async function getSecret(name) {
  try {
    const data = await client.getSecretValue({ SecretId: name }).promise();
    return data.SecretString;
  } catch (err) {
    console.error("Error fetching secret:", err);
    return null;
  }
}

module.exports = { getSecret };

// Usage example
if (require.main === module) {
  (async () => {
    const saPassword = await getSecret("recipes/dev/sa-password");
    console.log("SA Password from Secret Manager:", saPassword);
  })();
}

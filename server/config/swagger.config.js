// swagger.config.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IsraTube API',
      version: '1.0.0',
      description: 'API documentation for IsraTube video platform',
      contact: {
        name: 'API Support',
        email: 'support@isratube.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-xsrf-token',
          description: 'CSRF token required for POST/PUT/DELETE operations'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'SecurePass123!'
            },
            paid: {
              type: 'boolean',
              example: false
            },
            favArray: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 50,
              example: ['movie1', 'movie2']
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              example: 'USER'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        CSRFError: {
          description: 'CSRF token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Admin',
        description: 'Admin-only operations'
      },
      {
        name: 'Users',
        description: 'User management'
      },
      {
        name: 'Upload',
        description: 'File upload operations'
      }
    ]
  },
  apis: ['./server/server.js', './server/routes/*.js'] // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
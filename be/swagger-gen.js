import swaggerAutogen from 'swagger-autogen';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const doc = {
  info: {
    title: 'Mobile App Backend API',
    version: '1.0.0',
    description: 'API Documentation for UniBite Platform',
  },
  host: '20.255.57.186:8080',
  schemes: ['http'],
};

const outputFile = './docs/swagger.json';
const endpointsFiles = [
  './routes/index.js',
  './routes/users.js',
  './routes/auth.js',
  './routes/order.js',
  './routes/comments.js',
  './routes/shops.js',
  './routes/categories.js',
  './routes/foods.js',
  './routes/payment.js',
];

console.log('Generating swagger documentation...');
swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc).then(() => {
  console.log('✓ Swagger documentation generated successfully at ./docs/swagger.json');
  process.exit(0);
}).catch((err) => {
  console.error('Error generating swagger spec:', err);
  process.exit(1);
});

# Hướng dẫn Bắt đầu Nhanh - Backend Mobile App

## 1. Cài đặt và Chạy

### Bước 1: Cài đặt Dependencies
```bash
npm install
```

### Bước 2: Tạo file .env
```bash
cp .env.example .env
```

### Bước 3: Chạy Development Server
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:8080`

---

## 2. Kiểm Tra API

### Trang Chủ
```
GET http://localhost:8080/
```

### Health Check
```
GET http://localhost:8080/health
```

### Lấy Danh Sách Users
```
GET http://localhost:8080/api/users
```

### Tạo User Mới
```
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0123456789"
}
```

### Lấy User Theo ID
```
GET http://localhost:8080/api/users/1
```

### Cập Nhật User
```
PUT http://localhost:8080/api/users/1
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

### Xóa User
```
DELETE http://localhost:8080/api/users/1
```

---

## 3. Thêm Route và Controller Mới

### Ví dụ: Thêm API cho Products

**Bước 1: Tạo Controller** (`controllers/productsController.js`)
```javascript
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as productsService from '../services/productsService.js';

export const getAllProducts = async (req, res, next) => {
  try {
    logger.info('Fetching all products');
    const products = await productsService.getAllProducts();
    successResponse(res, products, 'Products retrieved successfully', 200);
  } catch (error) {
    logger.error('Error fetching products', error);
    errorResponse(res, error, 'Failed to fetch products', 500);
  }
};

// Thêm các function khác tương tự...
```

**Bước 2: Tạo Service** (`services/productsService.js`)
```javascript
import { logger } from '../utils/logger.js';

export const getAllProducts = async () => {
  try {
    logger.info('Service: Getting all products');
    // TODO: Lấy dữ liệu từ database
    return [];
  } catch (error) {
    logger.error('Service: Error getting all products', error);
    throw error;
  }
};
```

**Bước 3: Tạo Route** (`routes/products.js`)
```javascript
import express from 'express';
import * as productsController from '../controllers/productsController.js';

const router = express.Router();

router.get('/', productsController.getAllProducts);
// Thêm các route khác...

export default router;
```

**Bước 4: Thêm Route vào app.js**
```javascript
import productsRouter from './routes/products.js';

// ...
app.use('/api/products', productsRouter);
```

---

## 4. Thêm Middleware

**Ví dụ: Thêm Authentication Middleware**

```javascript
// Trong routes/users.js
import { authenticate } from '../middleware/authMiddleware.js';

router.get('/', authenticate, usersController.getAllUsers);
```

---

## 5. Kết Nối Database (MongoDB)

### Cài đặt MongoDB Driver
```bash
npm install mongoose
# hoặc
npm install mongodb
```

### Cập nhật `config/database.js`
```javascript
import mongoose from 'mongoose';
import environment from './environment.js';

const connectDB = async () => {
  try {
    await mongoose.connect(environment.node_env === 'production' 
      ? process.env.DATABASE_URL 
      : 'mongodb://localhost:27017/mobile-app'
    );
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error', error);
    process.exit(1);
  }
};

export default connectDB;
```

### Gọi trong `app.js`
```javascript
import connectDB from './config/database.js';

// Kết nối database
await connectDB();
```

---

## 6. Các Hàm Hữu Ích

### Response Handler
```javascript
import { successResponse, errorResponse, paginatedResponse } from './utils/responseHandler.js';

// Success response
successResponse(res, data, 'Success message', 200);

// Error response
errorResponse(res, error, 'Error message', 500);

// Paginated response
paginatedResponse(res, data, page, limit, total);
```

### Logger
```javascript
import { logger } from './utils/logger.js';

logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');
```

### Constants
```javascript
import { HTTP_STATUS, MESSAGES } from './utils/constants.js';

console.log(HTTP_STATUS.OK); // 200
console.log(MESSAGES.SUCCESS); // 'Request successful'
```

---

## 7. Cấu Trúc File Chuẩn

Khi tạo feature mới, tuân theo cấu trúc:
```
feature-name/
├── controllers/featuresController.js
├── services/featuresService.js
├── routes/features.js
└── models/Feature.js (nếu có)
```

---

## 8. Troubleshooting

| Vấn đề | Giải Pháp |
|-------|---------|
| Port 8080 đã được sử dụng | Thay đổi `PORT` trong `.env` |
| Module không tìm thấy | Kiểm tra đường dẫn import và `.js` extension |
| CORS Error | Cập nhật `FRONTEND_URL` trong `.env` |
| Database connection error | Kiểm tra cấu hình `DATABASE_URL` |

---

## 9. Câu Lệnh Hữu Ích

```bash
# Cài đặt package
npm install package-name

# Chạy development (auto-reload)
npm run dev

# Chạy production
npm start

# Cập nhật package
npm update

# Xóa node_modules và reinstall
rm -r node_modules package-lock.json
npm install
```

---

## 10. Resources

- [Express.js Documentation](https://expressjs.com/)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [MongoDB Mongoose](https://mongoosejs.com/)
- [REST API Best Practices](https://restfulapi.net/)

---

Happy Coding! 🚀

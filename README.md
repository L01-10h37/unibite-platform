# 🍔 UniBite - Food Delivery & Ordering Platform

<p align="center">
  <img src="./fe/assets/images/unibite-icon.png" alt="UniBite Logo" width="120" style="border-radius: 20px;"/>
</p>

<p align="center">
  <b>A smart online food delivery and ordering platform for customers and merchants (Sellers).</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-Expo%2054-000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Node.js-Express%20(ESM)-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Redis-Caching-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Elasticsearch-Search%20Engine-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" alt="Elasticsearch"/>
  <img src="https://img.shields.io/badge/Sentry-Monitoring-362D59?style=for-the-badge&logo=sentry&logoColor=white" alt="Sentry"/>
  <img src="https://img.shields.io/badge/Docker-CI%2FCD-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Getting Started](#-installation--getting-started)
  - [1. Backend Setup](#1-backend-setup-be)
  - [2. Frontend Setup (Mobile App)](#2-frontend-setup-fe)
- [Environment Variables (.env)](#-environment-variables-env)
- [API Documentation & Monitoring](#-api-documentation--monitoring)
- [CI/CD & Deployment](#-cicd--deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**UniBite** is a comprehensive mobile app ecosystem and RESTful API designed for online food ordering, dish discovery, real-time order processing, and merchant store management. The system incorporates cutting-edge technologies including Elasticsearch-powered fast search, Redis caching, VNPay payment gateway integration, and comprehensive APM & error monitoring via Sentry.

---

## 🏗 System Architecture

```
                               +-----------------------------+
                               |     UniBite Mobile App      |
                               | (React Native + Expo SDK 54)|
                               +--------------+--------------+
                                              |
                                              | REST API / HTTP
                                              v
+-----------------------------------------------------------------------------------------+
|                                    Backend (Express ESM)                                |
|                                                                                         |
|  [ Auth / JWT ]  [ Idempotency ]  [ Sentry APM ]  [ Morgan Logger ]  [ Swagger Docs ]   |
|                                                                                         |
|       Routes: /auth, /users, /shops, /foods, /cart, /orders, /payments, /vouchers       |
+---------------------+-------------------+---------------------+-------------------------+
                      |                   |                     |
         +------------v-----------+ +-----v------+ +------------v-----------+
         |     MongoDB Database   | | Redis Cache| |  Elasticsearch Cluster |
         |   (Users, Shops, Food, | |  & Session | |  (Fast Food / Shop     |
         |    Orders, Payments)   | |            | |   Full-text Search)    |
         +------------------------+ +------------+ +------------------------+
                      |                                         |
         +------------v-----------+                +------------v-----------+
         |  VNPay Gateway (IPN)   |                | Cloudinary Media Store |
         +------------------------+                +------------------------+
```

---

## ✨ Key Features

### 👤 Customer Flow (Buyer)
- **Authentication & Profile**: User registration, login with JWT & Refresh Token rotation, profile & avatar management.
- **Discovery & Search**:
  - Dynamic home feed with food categories, trending dishes, and top-rated restaurants.
  - Lightning-fast full-text search powered by Elasticsearch.
  - Multi-criteria filtering (category, price range, ratings).
- **Location & Maps**: Integrated GPS positioning (Expo Location) and interactive maps for accurate delivery addresses.
- **Cart & Order Management**: Real-time cart synchronization, item customizations, and order notes.
- **Discounts & Coupons (Vouchers)**: Flexible discount voucher application during checkout.
- **Multi-method Payments**: Cash on Delivery (COD) and online payments via **VNPay** (with automated IPN webhook verification).
- **Order Tracking & Reviews**: Real-time status updates (Pending, Preparing, Delivering, Completed) and food/shop review & rating system.

### 🏪 Merchant Flow (Seller Portal)
- **Store Setup & Management**: Create and customize store profile, operating hours, avatar, and banner.
- **Menu Management**: Full CRUD operations for dishes, price management, availability toggles, and direct image uploads via Cloudinary.
- **Order Processing**: Real-time incoming order notifications, order state transitions (accept, cook, dispatch, deliver, cancel).
- **Review Insights**: Monitor and respond to customer feedback and ratings.

### ⚙️ Infrastructure & Performance (DevOps)
- **Idempotency Control**: Prevents duplicate payment requests and concurrent order submissions.
- **Redis Caching**: Accelerates response times for frequently requested read endpoints.
- **Sentry Monitoring**: Full-stack observability (APM, p95 latency tracking, error diagnostics) on both Frontend and Backend.
- **Auto-generated Swagger Docs**: Interactive API documentation at `/api-docs`.
- **Automated CI/CD**: Jenkins Pipeline for automated Docker builds, container orchestration, and seamless deployments.

---

## 🛠 Tech Stack

### Frontend (`fe/`)
- **Core**: React Native (0.81.5), React 19, TypeScript
- **Framework**: [Expo SDK 54](https://expo.dev) (with Expo Router file-based routing)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`), React-Redux
- **UI & Styling**: Vanilla React Native StyleSheet, Lucide Icons, Vector Icons, Google Fonts (Be Vietnam Pro, Montserrat, Plus Jakarta Sans)
- **Maps & Location**: `react-native-maps`, `expo-location`
- **Storage & Security**: `@react-native-async-storage/async-storage`, `expo-secure-store`
- **Observability**: `@sentry/react-native`

### Backend (`be/`)
- **Runtime & Framework**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB (Mongoose ODM)
- **Cache & Search Engine**: Redis (`redis`), Elasticsearch (`@elastic/elasticsearch`)
- **Payment Gateway**: VNPay API Integration
- **Media & File Storage**: Cloudinary API, Multer
- **Security & Auth**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, CORS middleware, Cookie-Parser
- **API Documentation**: Swagger UI (`swagger-ui-express`, `swagger-autogen`)
- **Logging & Monitoring**: Morgan, Custom Logger, Sentry Node (`@sentry/node`)

### DevOps & Deployment
- **Containerization**: Multi-stage [Dockerfile](be/Dockerfile)
- **CI/CD Automation**: [Jenkinsfile](Jenkinsfile) for automated test, build, push to Docker Hub, and live container deployment

---

## 📁 Project Structure

```
Unibite/
├── be/                          # Backend Source Code (Node.js/Express ESM)
│   ├── app.js                   # Express application entrypoint & Sentry init
│   ├── instrument.js            # Early Sentry instrumentation
│   ├── config/                  # Database, Redis, Elasticsearch, and Env configs
│   ├── controllers/             # Request handling and response dispatching
│   ├── middleware/              # CORS, Error handler, Auth, Idempotency
│   ├── models/                  # Mongoose Schemas (User, Shop, Food, Order, Payment, etc.)
│   ├── routes/                  # API Route definitions (/auth, /foods, /orders, etc.)
│   ├── services/                # Core business logic layer
│   ├── utils/                   # Logger, response handlers, helper functions
│   ├── docs/                    # Swagger JSON specifications
│   ├── Dockerfile               # Production Docker configuration
│   └── package.json
│
├── fe/                          # Frontend Source Code (Expo / React Native)
│   ├── app/                     # Application Screens (Expo Router)
│   │   ├── (tabs)/              # Main tab screens (Home, Explore, Cart, Profile...)
│   │   ├── seller/              # Seller Portal Screens (Store & Menu Management)
│   │   ├── food-detail.tsx      # Dish detail view
│   │   ├── checkout.tsx         # Order checkout flow
│   │   └── address.tsx          # Delivery address management
│   ├── components/              # Reusable UI Components
│   ├── services/                # Backend API service integration
│   ├── store/                   # Redux store & state slices
│   ├── hooks/                   # Custom React Hooks
│   ├── constants/               # Colors, themes, API base URLs
│   ├── assets/                  # Images, fonts, and application icons
│   ├── app.json                 # Expo configuration file
│   └── package.json
│
├── Jenkinsfile                  # Jenkins automated CI/CD pipeline
├── SENTRY_METRICS_REPORT.md     # Sentry instrumentation and KPI metrics report
└── README.md                    # Project documentation
```

---

## 📋 Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: version `>= 18.x` (Node.js 20 LTS recommended)
- **Package Manager**: `npm` or `pnpm`
- **Databases**:
  - MongoDB `>= 6.0`
  - Redis Server `>= 7.0`
  - Elasticsearch `>= 8.x` (optional, for enhanced search indexing)
- **Mobile Development**:
  - **Expo Go** mobile app (available on iOS App Store & Android Play Store) or Android Studio / Xcode Simulator.

---

## 🚀 Installation & Getting Started

### 1. Backend Setup (`be/`)

```bash
# Navigate to the backend directory
cd be

# Install dependencies
npm install

# Create environment variable file from template
cp .env.example .env
# (Update PORT, DATABASE_URL, JWT_SECRET, REDIS_URL, etc., in your .env file)

# Run server in development mode (with auto-reload)
npm run dev

# Or run in production mode
npm start
```
> The API server will be available at: `http://localhost:8080`  
> Interactive Swagger UI: `http://localhost:8080/api-docs`

---

### 2. Frontend Setup (`fe/`)

```bash
# Navigate to the frontend directory
cd ../fe

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Once the Metro bundler starts:
- Press `a` to run on an **Android** emulator / connected device.
- Press `i` to run on an **iOS** simulator.
- Scan the displayed QR code with the **Expo Go** app on your physical device.

---

## 🔐 Environment Variables (.env)

Create a `.env` file in the `be/` directory with the following configuration keys:

```env
# Server Config
PORT=8080
NODE_ENV=development
API_URL=http://localhost

# Frontend URL (CORS Configuration)
FRONTEND_URL=http://localhost
FRONTEND_PORT=8081

# MongoDB Connection
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/unibite?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Cloudinary (Media Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay Payment Gateway
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8080/api/payments/vnpay-return

# Sentry Monitoring (Optional)
SENTRY_DSN=https://example@sentry.io/123456
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_ENABLE_DEBUG_ENDPOINT=1
```

---

## 📚 API Documentation & Monitoring

### Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | User login & obtain Access Token |
| `GET` | `/api/users/profile` | Retrieve authenticated user profile |
| `GET` | `/api/foods` | List food items (supports pagination & filtering) |
| `GET` | `/api/foods/:id` | Get detailed food item information |
| `GET` | `/api/shops` | List available food shops / merchants |
| `GET` | `/api/shops/:id` | Get shop profile and active menu |
| `GET` / `POST` | `/api/cart` | View and modify customer cart items |
| `POST` | `/api/orders` | Place a new food order |
| `GET` | `/api/orders` | Retrieve user's order history |
| `POST` | `/api/payments` | Initiate a payment transaction (COD / VNPay URL) |
| `GET` | `/api/payments/vnpay-return` | Handle VNPay redirect after customer payment |
| `GET` | `/api/payments/vnpay-ipn` | VNPay Webhook IPN for payment verification |
| `GET` | `/health` | Server health check endpoint |

Explore the interactive **Swagger UI** at `http://localhost:8080/api-docs` for schema definitions and live testing.

---

## 🚢 CI/CD & Deployment

The project includes an automated [Jenkinsfile](Jenkinsfile) pipeline for continuous delivery:
1. **Old Container Teardown**: Checks and gracefully removes existing backend containers.
2. **Docker Image Build**: Packages the backend using the multi-stage [Dockerfile](be/Dockerfile).
3. **Registry Push**: Authenticates and pushes images to **Docker Hub** (`luchanvu/unibite-backend`).
4. **Container Orchestration**: Injects secrets securely from Jenkins Credentials and runs the new container on port `8080`.
5. **Post-deploy Cleanup**: Automatically prunes dangling Docker images.

---

## 👥 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

<p align="center">
  Made with ❤️ by the <b>UniBite Team</b>
</p>

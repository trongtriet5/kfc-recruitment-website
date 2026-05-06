\# KFC Việt Nam - Recruitment Backend (NestJS)

Backend API cho hệ thống tuyển dụng KFC Việt Nam.

## Cài đặt

```bash
npm install
npm run db:generate
npm run db:push
```

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Cấu trúc

```
src/
├── auth/              # Authentication module
├── recruitment/       # Tuyển dụng module
├── requests/          # Đơn từ module
├── prisma/            # Prisma service
└── common/            # Common utilities
```

## API Endpoints

Base URL: `http://localhost:3001`

### Authentication
- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Lấy thông tin user

### Recruitment
- `GET /recruitment/candidates` - Danh sách ứng viên
- `POST /recruitment/candidates` - Tạo ứng viên
- `GET /recruitment/interviews` - Lịch phỏng vấn
- `POST /recruitment/interviews` - Tạo phỏng vấn
- `GET /recruitment/dashboard` - Dashboard
- `GET /recruitment/headcounts` - Định biên
- `GET /recruitment/proposals` - Đề xuất tuyển dụng
- `GET /recruitment/forms` - Form ứng tuyển
- `GET /recruitment/campaigns` - Chiến dịch tuyển dụng

## Authentication

JWT token trong header:
```
Authorization: Bearer <token>
```


# KFC Việt Nam - Recruitment System

Hệ thống quản lý tuyển dụng cho KFC Việt Nam.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: NestJS, Node.js, TypeScript
- **Database**: PostgreSQL với Prisma ORM

## Cài đặt

### Backend (NestJS)

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run start:dev
```

Backend sẽ chạy tại `http://localhost:3001`

### Frontend (Next.js)

```bash
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## Cấu hình

### Backend `.env`

```
DATABASE_URL="postgresql://user:password@localhost:5432/kfc_recruitment?schema=public"
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tính năng

### Tuyển dụng (Recruitment)
- Dashboard thống kê
- Quản lý ứng viên theo trạng thái
- Lịch phỏng vấn
- Đề xuất tuyển dụng
- Định biên headcount
- Quản lý form và link ứng tuyển
- Quản lý chiến dịch tuyển dụng

## API Endpoints

Base URL: `http://localhost:3001`

### Authentication
- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Lấy thông tin user

### Recruitment
- `GET /recruitment/candidates` - Danh sách ứng viên
- `POST /recruitment/candidates` - Tạo ứng viên
- `GET /recruitment/interviews` - Lịch phỏng vấn
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

## Phát triển

```bash
# Backend
cd backend
npm run start:dev

# Frontend
npm run dev

# Database
npm run db:generate
npm run db:push
```

## License

Proprietary - KFC Việt Nam

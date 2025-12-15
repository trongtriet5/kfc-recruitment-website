# Maycha HRIS

Hệ thống quản lý nhân sự (HRIS) cho công ty Maycha - công ty về thức uống (F&B).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: NestJS, Node.js, TypeScript
- **Database**: PostgreSQL với Prisma ORM
- **State Management**: Zustand, React Query

## Cấu trúc dự án

```
maycha_hris/
├── backend/          # NestJS Backend API
│   ├── src/
│   │   ├── auth/
│   │   ├── requests/
│   │   ├── employees/
│   │   ├── recruitment/
│   │   ├── timekeeping/
│   │   ├── payroll/
│   │   ├── contracts/
│   │   ├── decisions/
│   │   └── prisma/
│   └── prisma/
├── app/              # Next.js Frontend
│   ├── dashboard/
│   ├── login/
│   └── ...
└── components/       # React Components
```

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
# Từ thư mục gốc
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## Cấu hình

### Backend `.env`

Tạo file `backend/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/maycha_hris?schema=public"
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Frontend `.env.local`

Tạo file `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tính năng

### 1. Đơn từ (Requests)
- Dashboard với các thống kê
- Các loại đơn từ: nghỉ phép, vắng mặt, làm thêm, check-in/out, đổi ca, công tác, thôi việc

### 2. Tuyển dụng (Recruitment)
- Quản lý ứng viên theo trạng thái
- Lịch phỏng vấn
- Đề xuất tuyển dụng
- Định biên headcount

### 3. Nhân sự (HR)
- Dashboard thống kê
- Quản lý hồ sơ nhân sự
- Hợp đồng lao động
- Quyết định

### 4. Chấm công (Timekeeping)
- Check-in/out bằng GPS
- Bảng công

### 5. Bảng lương (Payroll)
- Tính lương tự động dựa trên chấm công

## API Endpoints

Base URL: `http://localhost:3001`

### Authentication
- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Lấy thông tin user (cần JWT token)

### Requests
- `GET /requests` - Lấy danh sách đơn từ
- `POST /requests` - Tạo đơn từ mới
- `GET /requests/:id` - Lấy chi tiết đơn từ
- `PATCH /requests/:id` - Cập nhật đơn từ
- `GET /requests/dashboard` - Dashboard thống kê

### Employees
- `GET /employees` - Lấy danh sách nhân sự
- `GET /employees/dashboard` - Dashboard thống kê

### Timekeeping
- `GET /timekeeping` - Lấy bảng chấm công
- `POST /timekeeping` - Check-in/out

### Payroll
- `GET /payroll` - Lấy bảng lương
- `POST /payroll/calculate` - Tính lương

### Recruitment
- `GET /recruitment/candidates` - Lấy danh sách ứng viên
- `GET /recruitment/interviews` - Lấy lịch phỏng vấn

## Authentication

Tất cả các endpoint (trừ `/auth/login`) đều yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

Token được lưu trong localStorage sau khi đăng nhập thành công.

## Phát triển

### Backend

```bash
cd backend
npm run start:dev      # Development
npm run build          # Build
npm run start:prod     # Production
```

### Frontend

```bash
npm run dev            # Development
npm run build          # Build
npm start              # Production
```

### Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Prisma Studio
npm run db:studio
```

## License

Proprietary - Maycha Company

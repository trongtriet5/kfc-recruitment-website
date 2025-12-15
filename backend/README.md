# Maycha HRIS Backend (NestJS)

Backend API cho hệ thống HRIS Maycha sử dụng NestJS.

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Chạy migrations
npm run db:push
# hoặc
npm run db:migrate
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
├── requests/          # Đơn từ module
├── employees/          # Nhân sự module
├── recruitment/       # Tuyển dụng module
├── timekeeping/       # Chấm công module
├── payroll/           # Bảng lương module
├── contracts/         # Hợp đồng module
├── decisions/         # Quyết định module
├── prisma/            # Prisma service
└── common/            # Common utilities
```

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

Token được trả về từ endpoint `/auth/login`.


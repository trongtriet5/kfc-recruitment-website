const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const formId = 'cmo9wsm2f000045i9m5q700wf';
  
  const fields = [
    { formId, name: 'full_name', label: 'Họ và tên', type: 'TEXT', placeholder: 'Nhập họ và tên', required: true, order: 0, width: 'full' },
    { formId, name: 'phone', label: 'Số điện thoại', type: 'PHONE', placeholder: 'Nhập số điện thoại', required: true, order: 1, width: 'full' },
    { formId, name: 'email', label: 'Email', type: 'EMAIL', placeholder: 'Nhập email', required: true, order: 2, width: 'full' },
    { formId, name: 'birthday', label: 'Ngày sinh', type: 'DATE', required: true, order: 3, width: 'half' },
    { formId, name: 'gender', label: 'Giới tính', type: 'SELECT', required: true, order: 4, width: 'half', options: JSON.stringify([{value: 'male', label: 'Nam'}, {value: 'female', label: 'Nữ'}]) },
  ];
  
  await prisma.formField.createMany({ data: fields });
  console.log('Added fields to form');
  
  await prisma.$disconnect();
}

main().catch(console.error);
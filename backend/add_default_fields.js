const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const formId = 'cmo9wsm2f000045i9m5q700wf';
  
  // Xóa fields cũ
  await prisma.formField.deleteMany({ where: { formId } });
  
  const fields = [
    { formId, name: 'fullName', label: 'Họ và tên', type: 'TEXT', placeholder: 'Nhập họ và tên', required: true, order: 0, width: 'full', helpText: 'Họ và tên theo CCCD/CMND' },
    { formId, name: 'gender', label: 'Giới tính', type: 'RADIO', required: true, order: 1, width: 'half', options: JSON.stringify([{value: 'MALE', label: 'Nam'}, {value: 'FEMALE', label: 'Nữ'}]) },
    { formId, name: 'dateOfBirth', label: 'Ngày sinh', type: 'DATE', required: true, order: 2, width: 'half', helpText: 'Ngày tháng năm sinh' },
    { formId, name: 'phone', label: 'Số điện thoại', type: 'TEXT', placeholder: 'Số điện thoại', required: true, order: 3, width: 'half', helpText: 'Số điện thoại liên hệ' },
    { formId, name: 'email', label: 'Email', type: 'EMAIL', placeholder: 'Email', required: true, order: 4, width: 'half' },
    { formId, name: 'cccd', label: 'Số CCCD/CMND', type: 'TEXT', placeholder: 'Nhập số CCCD/CMND', required: true, order: 5, width: 'full', helpText: 'Số CCCD hoặc CMND' },
    { formId, name: 'currentCity', label: 'Tỉnh/TP hiện tại', type: 'SELECT', required: true, order: 6, width: 'half', helpText: 'Tỉnh/Thành phố hiện tại' },
    { formId, name: 'currentWard', label: 'Quận/Huyện', type: 'SELECT', required: true, order: 7, width: 'half', helpText: 'Quận/Huyện' },
    { formId, name: 'currentStreet', label: 'Địa chỉ chi tiết', type: 'TEXTAREA', placeholder: 'Số nhà, đường, phường/xã', required: true, order: 8, width: 'full', helpText: 'Số nhà, tên đường, phường/xã' },
    { formId, name: 'permanentSameAsCurrent', label: 'Địa chỉ thường trú giống địa chỉ hiện tại', type: 'CHECKBOX', required: false, order: 9, width: 'full' },
    { formId, name: 'permanentCity', label: 'Tỉnh/TP thường trú', type: 'SELECT', required: false, order: 10, width: 'half' },
    { formId, name: 'permanentWard', label: 'Quận/Huyện thường trú', type: 'SELECT', required: false, order: 11, width: 'half' },
    { formId, name: 'permanentStreet', label: 'Địa chỉ thường trú', type: 'TEXTAREA', placeholder: 'Số nhà, đường, phường/xã', required: false, order: 12, width: 'full' },
    { formId, name: 'appliedPosition', label: 'Vị trí ứng tuyển', type: 'SELECT', required: true, order: 13, width: 'full' },
    { formId, name: 'appliedPositionOther', label: 'Vị trí khác', type: 'TEXT', placeholder: 'Nhập vị trí khác', required: false, order: 14, width: 'full' },
    { formId, name: 'availableStartDate', label: 'Ngày có thể bắt đầu làm việc', type: 'DATE', required: true, order: 15, width: 'half' },
    { formId, name: 'canWorkTet', label: 'Có thể làm việc Tết Nguyên Đán?', type: 'RADIO', required: true, order: 16, width: 'half', options: JSON.stringify([{value: 'Có', label: 'Có'}, {value: 'Không', label: 'Không'}]) },
    { formId, name: 'referrer', label: 'Người giới thiệu', type: 'SELECT', required: false, order: 17, width: 'half', options: JSON.stringify([{value: 'Không có', label: 'Không có'}, {value: 'Nhân viên KFC', label: 'Nhân viên KFC'}, {value: 'Người quen', label: 'Người quen'}, {value: 'Facebook', label: 'Facebook'}, {value: 'Website', label: 'Website'}, {value: 'Other', label: 'Khác'}]) },
    { formId, name: 'referrerName', label: 'Tên người giới thiệu', type: 'TEXT', placeholder: 'Nhập tên người giới thiệu', required: false, order: 18, width: 'half' },
    { formId, name: 'preferredLocations', label: 'Khu vực ưu tiên làm việc', type: 'MULTISELECT', required: false, order: 19, width: 'full', options: JSON.stringify([{value: 'TP.HCM', label: 'TP.HCM'}, {value: 'Hà Nội', label: 'Hà Nội'}, {value: 'Đà Nẵng', label: 'Đà Nẵng'}, {value: 'Cần Thơ', label: 'Cần Thơ'}]) },
    { formId, name: 'workExperience', label: 'Kinh nghiệm làm việc', type: 'TEXTAREA', placeholder: 'Mô tả kinh nghiệm làm việc trước đây', required: false, order: 20, width: 'full', helpText: 'Kinh nghiệm làm việc (nếu có)' },
  ];
  
  await prisma.formField.createMany({ data: fields });
  console.log('Added', fields.length, 'fields to form');
  
  const count = await prisma.formField.count({ where: { formId } });
  console.log('Total fields:', count);
  
  await prisma.$disconnect();
}

main().catch(console.error);
// Dữ liệu địa chỉ Việt Nam (tỉnh/thành, quận/huyện, phường/xã)
// Sử dụng API công khai: https://provinces.open-api.vn/

export interface Province {
  code: string
  name: string
}

export interface District {
  code: string
  name: string
  provinceCode: string
}

export interface Ward {
  code: string
  name: string
  districtCode: string
}

// Dữ liệu mẫu - có thể thay thế bằng API call
export const PROVINCES: Province[] = [
  { code: '01', name: 'Hà Nội' },
  { code: '79', name: 'Hồ Chí Minh' },
  { code: '31', name: 'Hải Phòng' },
  { code: '48', name: 'Đà Nẵng' },
  { code: '92', name: 'Cần Thơ' },
  { code: '75', name: 'Đồng Nai' },
  { code: '77', name: 'Bà Rịa - Vũng Tàu' },
  { code: '74', name: 'Bình Dương' },
  { code: '89', name: 'An Giang' },
  { code: '80', name: 'Long An' },
]

export const DISTRICTS: Record<string, District[]> = {
  '01': [
    { code: '001', name: 'Quận Ba Đình', provinceCode: '01' },
    { code: '002', name: 'Quận Hoàn Kiếm', provinceCode: '01' },
    { code: '003', name: 'Quận Tây Hồ', provinceCode: '01' },
    { code: '004', name: 'Quận Long Biên', provinceCode: '01' },
    { code: '005', name: 'Quận Cầu Giấy', provinceCode: '01' },
    { code: '006', name: 'Quận Đống Đa', provinceCode: '01' },
    { code: '007', name: 'Quận Hai Bà Trưng', provinceCode: '01' },
    { code: '008', name: 'Quận Hoàng Mai', provinceCode: '01' },
    { code: '009', name: 'Quận Thanh Xuân', provinceCode: '01' },
  ],
  '79': [
    { code: '760', name: 'Quận 1', provinceCode: '79' },
    { code: '761', name: 'Quận 2', provinceCode: '79' },
    { code: '762', name: 'Quận 3', provinceCode: '79' },
    { code: '763', name: 'Quận 4', provinceCode: '79' },
    { code: '764', name: 'Quận 5', provinceCode: '79' },
    { code: '765', name: 'Quận 6', provinceCode: '79' },
    { code: '766', name: 'Quận 7', provinceCode: '79' },
    { code: '767', name: 'Quận 8', provinceCode: '79' },
    { code: '768', name: 'Quận 9', provinceCode: '79' },
    { code: '769', name: 'Quận 10', provinceCode: '79' },
    { code: '770', name: 'Quận 11', provinceCode: '79' },
    { code: '771', name: 'Quận 12', provinceCode: '79' },
    { code: '772', name: 'Quận Bình Thạnh', provinceCode: '79' },
    { code: '773', name: 'Quận Tân Bình', provinceCode: '79' },
    { code: '774', name: 'Quận Tân Phú', provinceCode: '79' },
    { code: '775', name: 'Quận Phú Nhuận', provinceCode: '79' },
    { code: '776', name: 'Quận Gò Vấp', provinceCode: '79' },
    { code: '777', name: 'Quận Bình Tân', provinceCode: '79' },
    { code: '778', name: 'Quận Thủ Đức', provinceCode: '79' },
  ],
}

export const WARDS: Record<string, Ward[]> = {
  '760': [ // Quận 1
    { code: '26734', name: 'Phường Bến Nghé', districtCode: '760' },
    { code: '26737', name: 'Phường Đa Kao', districtCode: '760' },
    { code: '26740', name: 'Phường Bến Thành', districtCode: '760' },
    { code: '26743', name: 'Phường Nguyễn Thái Bình', districtCode: '760' },
    { code: '26746', name: 'Phường Phạm Ngũ Lão', districtCode: '760' },
    { code: '26749', name: 'Phường Cầu Ông Lãnh', districtCode: '760' },
    { code: '26752', name: 'Phường Cô Giang', districtCode: '760' },
    { code: '26755', name: 'Phường Nguyễn Cư Trinh', districtCode: '760' },
    { code: '26758', name: 'Phường Cầu Kho', districtCode: '760' },
  ],
  '761': [ // Quận 2
    { code: '26761', name: 'Phường Thạnh Mỹ Lợi', districtCode: '761' },
    { code: '26764', name: 'Phường An Lợi Đông', districtCode: '761' },
    { code: '26767', name: 'Phường Thủ Thiêm', districtCode: '761' },
    { code: '26770', name: 'Phường An Khánh', districtCode: '761' },
    { code: '26773', name: 'Phường An Phú', districtCode: '761' },
    { code: '26776', name: 'Phường Bình An', districtCode: '761' },
    { code: '26779', name: 'Phường Bình Khánh', districtCode: '761' },
    { code: '26782', name: 'Phường Bình Trưng Đông', districtCode: '761' },
    { code: '26785', name: 'Phường Bình Trưng Tây', districtCode: '761' },
    { code: '26788', name: 'Phường Cát Lái', districtCode: '761' },
    { code: '26791', name: 'Phường Thạnh Mỹ Lợi', districtCode: '761' },
  ],
  '772': [ // Quận Bình Thạnh
    { code: '26905', name: 'Phường 1', districtCode: '772' },
    { code: '26908', name: 'Phường 2', districtCode: '772' },
    { code: '26911', name: 'Phường 3', districtCode: '772' },
    { code: '26914', name: 'Phường 5', districtCode: '772' },
    { code: '26917', name: 'Phường 6', districtCode: '772' },
    { code: '26920', name: 'Phường 7', districtCode: '772' },
    { code: '26923', name: 'Phường 11', districtCode: '772' },
    { code: '26926', name: 'Phường 12', districtCode: '772' },
    { code: '26929', name: 'Phường 13', districtCode: '772' },
    { code: '26932', name: 'Phường 14', districtCode: '772' },
    { code: '26935', name: 'Phường 15', districtCode: '772' },
    { code: '26938', name: 'Phường 17', districtCode: '772' },
    { code: '26941', name: 'Phường 19', districtCode: '772' },
    { code: '26944', name: 'Phường 21', districtCode: '772' },
    { code: '26947', name: 'Phường 22', districtCode: '772' },
    { code: '26950', name: 'Phường 24', districtCode: '772' },
    { code: '26953', name: 'Phường 25', districtCode: '772' },
    { code: '26956', name: 'Phường 26', districtCode: '772' },
    { code: '26959', name: 'Phường 27', districtCode: '772' },
    { code: '26962', name: 'Phường 28', districtCode: '772' },
  ],
}

// Helper functions
export function getDistrictsByProvince(provinceCode: string): District[] {
  return DISTRICTS[provinceCode] || []
}

export function getWardsByDistrict(districtCode: string): Ward[] {
  return WARDS[districtCode] || []
}


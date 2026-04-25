import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const locationData = [
  {
    provinceName: 'Hà Nội',
    provinceCode: 'HN',
    wards: [
      { name: 'Phúc Tạn', code: 'PT' },
      { name: 'Ba Đình', code: 'BD' },
      { name: 'Hoàn Kiếm', code: 'HK' },
      { name: 'Hai Bà Trưng', code: 'HBT' },
      { name: 'Đống Đa', code: 'DD' },
      { name: 'Thanh Xuân', code: 'TX' },
      { name: 'Cầu Giấy', code: 'CG' },
      { name: 'Tây Hồ', code: 'TH' },
    ]
  },
  {
    provinceName: 'TP. Hồ Chí Minh',
    provinceCode: 'HCM',
    wards: [
      { name: 'Quận 1', code: 'Q1' },
      { name: 'Quận 2', code: 'Q2' },
      { name: 'Quận 3', code: 'Q3' },
      { name: 'Quận 4', code: 'Q4' },
      { name: 'Quận 5', code: 'Q5' },
      { name: 'Quận 6', code: 'Q6' },
      { name: 'Quận 7', code: 'Q7' },
      { name: 'Quận 8', code: 'Q8' },
      { name: 'Bình Thạnh', code: 'BT' },
      { name: 'Tân Bình', code: 'TBN' },
    ]
  },
  {
    provinceName: 'Đà Nẵng',
    provinceCode: 'DN',
    wards: [
      { name: 'Hải Châu', code: 'HC' },
      { name: 'Sơn Trà', code: 'ST' },
      { name: 'Thanh Khê', code: 'TK' },
      { name: 'Cẩm Lệ', code: 'CL' },
      { name: 'Ngũ Hành Sơn', code: 'NHS' },
    ]
  },
  {
    provinceName: 'Hải Phòng',
    provinceCode: 'HP',
    wards: [
      { name: 'Hồng Bàng', code: 'HB' },
      { name: 'Ngô Quyền', code: 'NQ' },
      { name: 'Lê Chân', code: 'LC' },
      { name: 'Kiến An', code: 'KA' },
    ]
  },
  {
    provinceName: 'Cần Thơ',
    provinceCode: 'CT',
    wards: [
      { name: 'Ninh Kiều', code: 'NK' },
      { name: 'Bình Thủy', code: 'BTH' },
      { name: 'Cái Răng', code: 'CR' },
      { name: 'Ô Môn', code: 'OM' },
    ]
  },
  {
    provinceName: 'Biên Hòa',
    provinceCode: 'BH',
    wards: [
      { name: 'Thị xã Biên Hòa', code: 'TXBH' },
      { name: 'Long Bình', code: 'LB' },
      { name: 'Tân Hòa', code: 'THA' },
    ]
  },
  {
    provinceName: 'Vũng Tàu',
    provinceCode: 'VT',
    wards: [
      { name: 'Thành phố Vũng Tàu', code: 'TPVT' },
      { name: 'Phú Mỹ', code: 'PM' },
    ]
  },
]

async function seedLocations() {
  console.log('Seeding provinces and wards...')

  for (const location of locationData) {
    const province = await prisma.province.upsert({
      where: { code: location.provinceCode },
      update: {},
      create: {
        name: location.provinceName,
        code: location.provinceCode,
        fullName: location.provinceName,
      },
    })

    for (const ward of location.wards) {
      await prisma.ward.upsert({
        where: { code: ward.code },
        update: {},
        create: {
          name: ward.name,
          code: ward.code,
          provinceCode: province.code,
        },
      })
    }
  }

  console.log('✅ Seeding completed')
}

seedLocations()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

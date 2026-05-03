import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('types')
export class TypesController {
  constructor(private prisma: PrismaService) {}

  private readonly ALLOWED_SMAM_RESULTS = [
    { code: 'SM_AM_PASSED', name: 'SM/AM PV đạt' },
    { code: 'SM_AM_FAILED', name: 'SM/AM PV loại' },
    { code: 'SM_AM_NO_SHOW', name: 'SM/AM PV không đến' },
    { code: 'OM_PV_PASSED', name: 'OM PV đạt' },
    { code: 'OM_PV_FAILED', name: 'OM PV loại' },
    { code: 'OM_PV_NO_SHOW', name: 'OM PV không đến' },
  ];

  private readonly staticTypes: Record<string, any[]> = {
    RECRUITMENT_TYPE: [
      { id: 'ke_hoach', code: 'KE_HOACH', name: 'Tuyển theo kế hoạch' },
      { id: 'thay_the', code: 'THAY_THE', name: 'Tuyển thay thế' },
      { id: 'ngoai_kh', code: 'NGOAI_KE_HOACH', name: 'Tuyển ngoài kế hoạch' },
    ],
    INTERVIEW_TYPE: [
      { id: 'hr', code: 'HR', name: 'Phỏng vấn HR' },
      { id: 'sm_am', code: 'SM_AM', name: 'Phỏng vấn SM/AM' },
      { id: 'om_pv', code: 'OM_PV', name: 'Phỏng vấn OM/PV' },
    ],
    INTERVIEW_RESULT: [
      { id: 'passed', code: 'PASSED', name: 'Đạt' },
      { id: 'failed', code: 'FAILED', name: 'Không đạt' },
      { id: 'pending', code: 'PENDING', name: 'Chờ kết quả' },
    ],
    PROPOSAL_STATUS: [
      { id: 'pending', code: 'PENDING', name: 'Chờ duyệt' },
      { id: 'approved', code: 'APPROVED', name: 'Đã duyệt' },
      { id: 'rejected', code: 'REJECTED', name: 'Từ chối' },
    ],
  };

  @Get('by-category/:category')
  async getByCategory(@Param('category') category: string, @Query('role') role?: string) {
    if (category === 'CANDIDATE_STATUS') {
      // If role is SM/AM, return limited statuses
      if (role === 'SM' || role === 'AM') {
        return this.ALLOWED_SMAM_RESULTS;
      }
      
      const statuses = await this.prisma.candidateStatus.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      return statuses;
    }
    return this.staticTypes[category] || [];
  }
}

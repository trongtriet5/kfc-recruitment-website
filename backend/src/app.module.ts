import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RequestsModule } from './requests/requests.module';
import { EmployeesModule } from './employees/employees.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { TimekeepingModule } from './timekeeping/timekeeping.module';
import { PayrollModule } from './payroll/payroll.module';
import { ContractsModule } from './contracts/contracts.module';
import { DecisionsModule } from './decisions/decisions.module';
import { TypesModule } from './types/types.module';
import { OrganizationModule } from './organization/organization.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RequestsModule,
    EmployeesModule,
    RecruitmentModule,
    TimekeepingModule,
    PayrollModule,
    ContractsModule,
    DecisionsModule,
    TypesModule,
    OrganizationModule,
  ],
})
export class AppModule {}


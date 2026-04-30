import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scope = this.reflector.get<string>('scope', context.getHandler());
    if (!scope) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Vui lòng đăng nhập');
    }

    // ADMIN can access everything
    if (user.role === 'ADMIN') return true;

    // Get user's store association
    const userWithStore = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        managedStore: { select: { id: true, name: true } },
        amStores: { select: { id: true, name: true } }
      }
    });

    if (scope === 'own-store') {
      // SM can only access their own store
      if (user.role === 'USER' && userWithStore?.managedStore) {
        request.storeScope = userWithStore.managedStore.id;
        return true;
      }
      // MANAGER (AM) can access stores they manage
      if (user.role === 'MANAGER' && userWithStore?.amStores?.length > 0) {
        request.storeScope = userWithStore.amStores.map(s => s.id);
        return true;
      }
      throw new ForbiddenException('Bạn không được phân cửa hàng nào');
    }

    if (scope === 'own-proposal') {
      // Only allow users to see their own proposals
      const proposalId = request.params?.id || request.body?.proposalId;
      if (proposalId) {
        const proposal = await this.prisma.recruitmentProposal.findUnique({
          where: { id: proposalId },
          include: { store: { select: { id: true, smId: true, amId: true } } }
        });
        
        if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');
        
        // Check ownership
        const isStoreSM = proposal.store?.smId === user.id;
        const isStoreAM = proposal.store?.amId === user.id;
        
        if (user.role === 'USER' && !isStoreSM) {
          throw new ForbiddenException('Bạn chỉ xem được đề xuất của cửa hàng mình');
        }
        if (user.role === 'MANAGER' && !isStoreAM) {
          throw new ForbiddenException('Bạn chỉ xem được đề xuất của cửa hàng bạn quản lý');
        }
      }
      return true;
    }

    return true;
  }
}
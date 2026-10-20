import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Designer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generic ownership guard. Routes using this guard must include an :id param
 * and the service must expose a findOne method that returns { designerId }.
 * This guard is typically used as a base — feature guards extend it.
 */
@Injectable()
export class DesignerOwnershipGuard implements CanActivate {
  constructor(protected readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: Designer;
      params: Record<string, string>;
    }>();

    const designer = request.user;
    const resourceId = request.params['id'];

    if (!resourceId) {
      return true; // No resource ID — let the controller handle it
    }

    // Generic check: look up any Order or Customer that has a designerId field
    // Feature-specific guards override this method with the correct model lookup
    const designerId = await this.getResourceDesignerId(resourceId);

    if (!designerId) {
      throw new NotFoundException('Resource not found');
    }

    if (designerId !== designer.id) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }

  // Override in subclasses for specific resource types
  protected async getResourceDesignerId(_id: string): Promise<string | null> {
    return null;
  }
}

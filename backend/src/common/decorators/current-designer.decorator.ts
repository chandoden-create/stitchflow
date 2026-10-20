import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Designer } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Extracts the designer object injected by JwtStrategy.validate() from the request.
 */
export const CurrentDesigner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Designer => {
    const request = ctx.switchToHttp().getRequest<{ user: Designer }>();
    return request.user;
  },
);

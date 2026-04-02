import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@toori360/shared';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;
    return user.tenantId;
  },
);

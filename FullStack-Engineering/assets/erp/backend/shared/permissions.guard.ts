import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma.service';

const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (code: string) => SetMetadata(PERMISSION_KEY, code);

// Va después de JwtGuard. El SP comprueba además que la cuenta siga activa.
// Sin caché de proceso: revocar un permiso debe surtir efecto de inmediato.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const code = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!code) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    if (!user) throw new ForbiddenException();

    const [row] = await this.db.$queryRaw<{ allowed: boolean }[]>`
      SELECT app.user_has_permission(${user.id}::uuid, ${code}) AS allowed`;
    if (!row?.allowed) throw new ForbiddenException();
    return true;
  }
}

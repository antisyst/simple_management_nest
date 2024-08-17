import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  JwtService,
  TokenExpiredError,
  JsonWebTokenError,
  NotBeforeError,
} from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequestWithUser } from './request-with-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!this.isAuthorized(payload.roles, ['admin', 'user'])) {
        throw new ForbiddenException('Insufficient permissions');
      }

      request.user = payload;
    } catch (error) {
      this.handleTokenError(error);
    }

    return super.canActivate(context);
  }

  private extractTokenFromHeader(request: RequestWithUser): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Malformed authorization header');
    }

    return token;
  }

  private isAuthorized(userRoles: string[], requiredRoles: string[]): boolean {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    const roleSet = new Set(userRoles);
    return requiredRoles.some((role) => roleSet.has(role));
  }

  private handleTokenError(error: any): void {
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedException('Token has expired');
    } else if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid token');
    } else if (error instanceof NotBeforeError) {
      throw new UnauthorizedException('Token not active');
    } else {
      throw new UnauthorizedException('Unable to process token');
    }
  }
}

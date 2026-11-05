import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { DomainError } from './domain.error';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof DomainError) {
      return reply.status(exception.status).send({
        error: { code: exception.code, message: exception.message },
      });
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const payload =
        typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object'
          ? body
          : { error: { code: 'HTTP_ERROR', message: exception.message } };
      return reply.status(exception.getStatus()).send(payload);
    }

    // Inesperado: el detalle queda en los logs y jamás llega al cliente.
    this.logger.error(exception);
    return reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
  }
}

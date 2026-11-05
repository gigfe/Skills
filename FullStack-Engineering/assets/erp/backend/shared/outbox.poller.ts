import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from './prisma.service';

type OutboxEvent = { id: string; event_type: string; payload: object };

// Publica en BullMQ los eventos que los SPs dejaron en core.outbox.
// Encola primero y marca después: si el proceso cae entre ambos, el evento se reintenta
// (at-least-once). jobId = id del evento evita la mayoría de duplicados, pero no todos,
// así que los procesadores deben ser idempotentes.
// Registra la cola en el módulo con BullModule.registerQueue({ name: 'domain-events' }).
@Injectable()
export class OutboxPoller {
  private readonly logger = new Logger(OutboxPoller.name);
  private running = false;

  constructor(
    private readonly db: PrismaService,
    @InjectQueue('domain-events') private readonly queue: Queue,
  ) {}

  @Interval(2000)
  async publishPending() {
    if (this.running) return;
    this.running = true;
    try {
      const events = await this.db.$queryRaw<OutboxEvent[]>`SELECT * FROM app.outbox_pending(100)`;
      for (const event of events) {
        await this.queue.add(event.event_type, event.payload, {
          jobId: event.id,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        });
        await this.db.$queryRaw`SELECT app.outbox_mark_published(${[event.id]}::uuid[])`;
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.running = false;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';
import { mapSpError } from '../../../shared/sp-error.mapper';
import { CreateRentalOrderInput, RentalOrder, RentalOrdersPort } from '../application/ports/rental-orders.port';

type RentalOrderRow = { id: string; status: string; start_date: Date; end_date: Date };

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

// Único lugar con SQL del módulo. Tagged template: los valores siempre van parametrizados.
@Injectable()
export class RentalOrdersSpAdapter implements RentalOrdersPort {
  constructor(private readonly db: PrismaService) {}

  async create(actorId: string, input: CreateRentalOrderInput): Promise<RentalOrder> {
    try {
      const [row] = await this.db.$queryRaw<RentalOrderRow[]>`
        SELECT * FROM app.rental_order_create(
          ${actorId}::uuid,
          ${input.customerId}::uuid,
          ${input.equipmentId}::uuid,
          ${input.startDate}::date,
          ${input.endDate}::date
        )`;
      return {
        id: row.id,
        status: row.status,
        startDate: toIsoDate(row.start_date),
        endDate: toIsoDate(row.end_date),
      };
    } catch (error) {
      return mapSpError(error);
    }
  }
}

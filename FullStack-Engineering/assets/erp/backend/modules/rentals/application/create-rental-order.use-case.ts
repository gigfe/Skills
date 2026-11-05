import { CreateRentalOrderInput, RentalOrder, RentalOrdersPort } from './ports/rental-orders.port';

// Delgado a propósito: la regla está en el SP. Aquí iría la orquestación con otros puertos.
// Sin decoradores de NestJS: se registra con useFactory en rentals.module.ts.
export class CreateRentalOrderUseCase {
  constructor(private readonly orders: RentalOrdersPort) {}

  execute(actorId: string, input: CreateRentalOrderInput): Promise<RentalOrder> {
    return this.orders.create(actorId, input);
  }
}

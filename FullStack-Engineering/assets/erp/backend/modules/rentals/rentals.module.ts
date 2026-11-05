import { Module } from '@nestjs/common';
import { JwtGuard } from '../../shared/jwt.guard';
import { PermissionsGuard } from '../../shared/permissions.guard';
import { PrismaService } from '../../shared/prisma.service';
import { CreateRentalOrderUseCase } from './application/create-rental-order.use-case';
import { RENTAL_ORDERS_PORT, RentalOrdersPort } from './application/ports/rental-orders.port';
import { RentalsController } from './http/rentals.controller';
import { RentalOrdersSpAdapter } from './infrastructure/rental-orders.sp-adapter';

// En el proyecto real, PrismaService viene de un DatabaseModule global, para tener un solo pool.
@Module({
  controllers: [RentalsController],
  providers: [
    PrismaService,
    JwtGuard,
    PermissionsGuard,
    { provide: RENTAL_ORDERS_PORT, useClass: RentalOrdersSpAdapter },
    {
      provide: CreateRentalOrderUseCase,
      inject: [RENTAL_ORDERS_PORT],
      useFactory: (orders: RentalOrdersPort) => new CreateRentalOrderUseCase(orders),
    },
  ],
})
export class RentalsModule {}

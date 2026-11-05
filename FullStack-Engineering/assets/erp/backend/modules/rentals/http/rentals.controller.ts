import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../../shared/jwt.guard';
import { PermissionsGuard, RequirePermission } from '../../../shared/permissions.guard';
import { ZodValidationPipe } from '../../../shared/zod-validation.pipe';
import { CreateRentalOrderUseCase } from '../application/create-rental-order.use-case';
import { CreateRentalOrderDto, createRentalOrderSchema } from './rentals.schemas';

@Controller('rental-orders')
@UseGuards(JwtGuard, PermissionsGuard)
export class RentalsController {
  constructor(private readonly createRentalOrder: CreateRentalOrderUseCase) {}

  @Post()
  @RequirePermission('rental-order:create')
  create(
    @Req() request: { user: { id: string } },
    @Body(new ZodValidationPipe(createRentalOrderSchema)) body: CreateRentalOrderDto,
  ) {
    return this.createRentalOrder.execute(request.user.id, body);
  }
}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Único punto con Prisma. Se usa solo desde adapters y guards, y solo para llamar SPs.
// Si tu versión de Prisma exige driver adapter, pásalo aquí vía super({ adapter }).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

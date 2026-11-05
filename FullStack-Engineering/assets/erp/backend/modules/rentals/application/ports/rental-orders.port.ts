export type CreateRentalOrderInput = {
  customerId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
};

export type RentalOrder = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
};

export const RENTAL_ORDERS_PORT = Symbol('RENTAL_ORDERS_PORT');

export interface RentalOrdersPort {
  create(actorId: string, input: CreateRentalOrderInput): Promise<RentalOrder>;
}

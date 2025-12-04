/**
 * Database Module for Payment Microservice
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../src/payments/entities/payment.entity';
import { PaymentTransaction } from '../../src/payments/entities/payment-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Payment, PaymentTransaction],
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.NODE_ENV === 'development',
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}


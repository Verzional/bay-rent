#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4ea9647a195e46c3e045e6f6e8eff6e738ac12bd60bfd0d261472a6461be7f62/contract';
import endContract from '../../snapshots/4ea9647a195e46c3e045e6f6e8eff6e738ac12bd60bfd0d261472a6461be7f62/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Garage',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('daily_rate', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('garage_code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kwh_rate', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['garage_code']),
          checkExpression('Garage_status_check_d239648e', sql`"status" IN ('AVAILABLE', 'USED')`),
          checkExpression('Garage_type_check_bdcd1783', sql`"type" IN ('BICYCLE', 'CAR', 'EV')`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Rental',
        columns: [
          col('days_count', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('end_date', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('garage_code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('payment_proof_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rental_id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rental_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('start_date', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('total_cost', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('vehicle_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['rental_id']),
          checkExpression(
            'Rental_rental_type_check_a6acda2b',
            sql`"rental_type" IN ('DAILY', 'MONTHLY')`,
          ),
          checkExpression('Rental_status_check_0a2783e1', sql`"status" IN ('ACTIVE', 'COMPLETED')`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'RentalExtension',
        columns: [
          col('admin_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('extension_id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('new_end_date', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('payment_proof_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('previous_end_date', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('remaining_cost', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('rental_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['extension_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('full_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('national_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('verification_status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['user_id']),
          checkExpression('User_role_check_b56b1992', sql`"role" IN ('ADMIN', 'TENANT')`),
          checkExpression(
            'User_verification_status_check_bb09dd42',
            sql`"verification_status" IN ('PENDING', 'ACCEPTED', 'REJECTED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Vehicle',
        columns: [
          col('battery_kwh', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('brand_model', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('license_plate', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tenant_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('vehicle_id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['vehicle_id']),
          checkExpression(
            'Vehicle_type_check_593c08a5',
            sql`"type" IN ('BICYCLE', 'MOTORCYCLE', 'CAR', 'EV')`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_national_id_key',
        columns: ['national_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Vehicle',
        constraint: 'Vehicle_license_plate_key',
        columns: ['license_plate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Rental',
        index: 'Rental_garage_code_idx_49121155',
        columns: ['garage_code'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Rental',
        index: 'Rental_vehicle_id_idx_fbbcb34b',
        columns: ['vehicle_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RentalExtension',
        index: 'RentalExtension_admin_id_idx_78cc3551',
        columns: ['admin_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RentalExtension',
        index: 'RentalExtension_rental_id_idx_1429c479',
        columns: ['rental_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Vehicle',
        index: 'Vehicle_tenant_id_idx_41c0d441',
        columns: ['tenant_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Rental',
        foreignKey: {
          name: 'Rental_garage_code_fkey',
          columns: ['garage_code'],
          references: { schema: 'public', table: 'Garage', columns: ['garage_code'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Rental',
        foreignKey: {
          name: 'Rental_vehicle_id_fkey',
          columns: ['vehicle_id'],
          references: { schema: 'public', table: 'Vehicle', columns: ['vehicle_id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RentalExtension',
        foreignKey: {
          name: 'RentalExtension_rental_id_fkey',
          columns: ['rental_id'],
          references: { schema: 'public', table: 'Rental', columns: ['rental_id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RentalExtension',
        foreignKey: {
          name: 'RentalExtension_admin_id_fkey',
          columns: ['admin_id'],
          references: { schema: 'public', table: 'User', columns: ['user_id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Vehicle',
        foreignKey: {
          name: 'Vehicle_tenant_id_fkey',
          columns: ['tenant_id'],
          references: { schema: 'public', table: 'User', columns: ['user_id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

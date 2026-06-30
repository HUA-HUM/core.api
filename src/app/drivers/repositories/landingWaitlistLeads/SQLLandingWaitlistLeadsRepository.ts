import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ILandingWaitlistLeadsRepository } from '../../../../core/adapters/repositories/landingWaitlistLeads/ILandingWaitlistLeadsRepository';
import {
  CreateLandingWaitlistLeadData,
  LandingWaitlistLead,
} from '../../../../core/entities/landingWaitlistLeads/LandingWaitlistLead';

interface LandingWaitlistLeadRow {
  id: string;
  firstName?: string;
  firstname?: string;
  first_name?: string;
  lastName?: string;
  lastname?: string;
  last_name?: string;
  email: string;
  phoneNumber?: string;
  phonenumber?: string;
  phone_number?: string;
  operatingSystem?: string;
  operatingsystem?: string;
  operating_system?: string;
  createdAt?: Date | string;
  createdat?: Date | string;
  created_at?: Date | string;
  updatedAt?: Date | string;
  updatedat?: Date | string;
  updated_at?: Date | string;
}

@Injectable()
export class SQLLandingWaitlistLeadsRepository implements ILandingWaitlistLeadsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async save(
    data: CreateLandingWaitlistLeadData,
  ): Promise<LandingWaitlistLead> {
    const rows = await this.queryRows<LandingWaitlistLeadRow>(
      `
        insert into landing_waitlist_leads (
          first_name,
          last_name,
          email,
          phone_number,
          operating_system
        )
        values ($1, $2, $3, $4, $5)
        on conflict (email)
        do update set
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          phone_number = excluded.phone_number,
          operating_system = excluded.operating_system,
          updated_at = now()
        returning
          id,
          first_name as "firstName",
          last_name as "lastName",
          email,
          phone_number as "phoneNumber",
          operating_system as "operatingSystem",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phoneNumber,
        data.operatingSystem,
      ],
    );

    return this.mapRowToLead(rows[0]);
  }

  async findAll(): Promise<LandingWaitlistLead[]> {
    const rows = await this.queryRows<LandingWaitlistLeadRow>(
      `
        select
          id,
          first_name as "firstName",
          last_name as "lastName",
          email,
          phone_number as "phoneNumber",
          operating_system as "operatingSystem",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from landing_waitlist_leads
        order by created_at asc
      `,
      [],
    );

    return rows.map((row) => this.mapRowToLead(row));
  }

  private mapRowToLead(row: LandingWaitlistLeadRow): LandingWaitlistLead {
    return {
      id: row.id,
      firstName: row.firstName ?? row.firstname ?? row.first_name ?? '',
      lastName: row.lastName ?? row.lastname ?? row.last_name ?? '',
      email: row.email,
      phoneNumber: row.phoneNumber ?? row.phonenumber ?? row.phone_number ?? '',
      operatingSystem:
        row.operatingSystem ??
        row.operatingsystem ??
        row.operating_system ??
        '',
      createdAt: this.toDate(
        row.createdAt ?? row.createdat ?? row.created_at,
        'createdAt',
      ),
      updatedAt: this.toDate(
        row.updatedAt ?? row.updatedat ?? row.updated_at,
        'updatedAt',
      ),
    };
  }

  private toDate(value: unknown, fieldName: string): Date {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid landing waitlist lead date: ${fieldName}`);
    }

    return date;
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);

    if (
      Array.isArray(result) &&
      result.length === 2 &&
      Array.isArray(result[0]) &&
      typeof result[1] === 'number'
    ) {
      return result[0] as T[];
    }

    return result as T[];
  }
}

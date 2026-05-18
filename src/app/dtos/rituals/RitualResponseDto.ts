import { Ritual, RitualStatus } from '../../../core/entities/rituals/Ritual';

export class RitualResponseDto {
  id!: string;
  userId!: string;
  title!: string;
  description!: string | null;
  icon!: string;
  durationMinutes!: number;
  weekdays!: number[];
  startTime!: string | null;
  endTime!: string | null;
  appCount!: number;
  categoryCount!: number;
  domainCount!: number;
  selectionDigest!: string | null;
  status!: RitualStatus;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(ritual: Ritual): RitualResponseDto {
    return {
      id: ritual.id,
      userId: ritual.userId,
      title: ritual.title,
      description: ritual.description,
      icon: ritual.icon,
      durationMinutes: ritual.durationMinutes,
      weekdays: ritual.weekdays,
      startTime: ritual.startTime,
      endTime: ritual.endTime,
      appCount: ritual.appCount,
      categoryCount: ritual.categoryCount,
      domainCount: ritual.domainCount,
      selectionDigest: ritual.selectionDigest,
      status: ritual.status,
      createdAt: ritual.createdAt.toISOString(),
      updatedAt: ritual.updatedAt.toISOString(),
    };
  }
}

import { Mode, ModeStatus } from '../../../core/entities/modes/Mode';

export class ModeResponseDto {
  id!: string;
  userId!: string;
  templateKey!: string;
  title!: string;
  icon!: string;
  appCount!: number;
  categoryCount!: number;
  domainCount!: number;
  selectionDigest!: string | null;
  isProtected!: boolean;
  nfcUnlockEnabled!: boolean;
  status!: ModeStatus;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(mode: Mode): ModeResponseDto {
    return {
      id: mode.id,
      userId: mode.userId,
      templateKey: mode.templateKey,
      title: mode.title,
      icon: mode.icon,
      appCount: mode.appCount,
      categoryCount: mode.categoryCount,
      domainCount: mode.domainCount,
      selectionDigest: mode.selectionDigest,
      isProtected: mode.isProtected,
      nfcUnlockEnabled: mode.nfcUnlockEnabled,
      status: mode.status,
      createdAt: mode.createdAt.toISOString(),
      updatedAt: mode.updatedAt.toISOString(),
    };
  }
}

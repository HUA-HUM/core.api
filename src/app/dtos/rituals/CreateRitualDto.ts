export class CreateRitualDto {
  title!: string;
  description?: string | null;
  icon!: string;
  durationMinutes!: number;
  weekdays!: number[];
  startTime?: string | null;
  endTime?: string | null;
  appCount!: number;
  categoryCount!: number;
  domainCount!: number;
  selectionDigest?: string | null;
  isProtected?: boolean;
  nfcUnlockEnabled?: boolean;
  password?: string | null;
}

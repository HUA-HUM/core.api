export class UpdateModeDto {
  title!: string;
  icon!: string;
  appCount!: number;
  categoryCount!: number;
  domainCount!: number;
  selectionDigest?: string | null;
  isProtected?: boolean;
  nfcUnlockEnabled?: boolean;
  password?: string | null;
}

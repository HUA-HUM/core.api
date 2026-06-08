export function requiredDateISOString(value: unknown, fieldName: string): string {
  const date = normalizeDate(value);

  if (!date) {
    throw new Error(`Invalid date field: ${fieldName}`);
  }

  return date.toISOString();
}

export function nullableDateISOString(value: unknown): string | null {
  return normalizeDate(value)?.toISOString() ?? null;
}

function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function validateIsArrayOfObjects(data: unknown): data is { [key: string]: unknown }[] {
  return Array.isArray(data) && data.every(item => typeof item === "object" && item !== null);
}

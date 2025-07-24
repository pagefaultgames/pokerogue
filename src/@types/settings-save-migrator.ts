export interface SettingsSaveMigrator {
  version: string;
  // biome-ignore lint/complexity/noBannedTypes: TODO - refactor settings
  migrate: (data: Object) => void;
}

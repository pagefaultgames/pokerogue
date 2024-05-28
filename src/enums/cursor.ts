export enum CursorMemory {
  Off = 0,
  Command = 1 << 0,
  Move = 1 << 1,
  Both = Command | Move
}

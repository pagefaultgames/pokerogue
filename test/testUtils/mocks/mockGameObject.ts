export interface MockGameObject {
  name: string;
  active: boolean;
  destroy?(): void;
  setActive(active: boolean): this;
  setName(name: string): this;
}

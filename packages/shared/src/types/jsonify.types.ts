export type Jsonify<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? Jsonify<Item>[]
    : T extends object
      ? { [Key in keyof T]: Jsonify<T[Key]> }
      : T;

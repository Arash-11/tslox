import { Token } from './token';
import { RuntimeError } from './error';

export default class Environment {
  private values: Map<string, Object | null> = new Map();

  get(name: Token): Object {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)!;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: Object | null) {
    this.values.set(name, value);
  }
}

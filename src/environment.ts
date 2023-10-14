import { Token } from './token';
import { RuntimeError } from './error';

export default class Environment {
  enclosing: Environment | null;
  private values: Map<string, Object | null> = new Map();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing || null;
  }

  get(name: Token): Object {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)!;
    }

    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assign(name: Token, value: Object) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: Object | null) {
    this.values.set(name, value);
  }
}

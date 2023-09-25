import { TokenType } from './types';

export default class Token {
  constructor(
    public type: TokenType,
    public lexeme: string,
    public literal: object | null,
    public line: number
  ) {}

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
import { TokenType, Token } from './token';

export class Error {
  static hadError = false;

  static error(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      Error.report(token.line, ' at end', message);
    } else {
      Error.report(token.line, ` at '${token.lexeme}'`, message);
    }
  }

  static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    Error.hadError = true;
  }
}

export class ParseError extends Error {};

export class SyntaxError extends Error {
  name = 'SyntaxError'

  constructor(line: number, message: string) {
    super();
    Error.report(line, '', message);
  }
};

import { TokenType, Token } from './token';

export class Error {
  static hadError = false;
  static hadRuntimeError = false;

  static error(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      Error.report(token.line, 'at end', message);
    } else {
      Error.report(token.line, `at '${token.lexeme}'`, message);
    }
  }

  static runtimeError(error: RuntimeError) {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    Error.hadRuntimeError = true;
  }

  static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    Error.hadError = true;
  }
}

export class ParseError extends Error {}

export class SyntaxError extends Error {
  name = 'SyntaxError';

  constructor(line: number, message: string) {
    super();
    Error.report(line, '', message);
  }
}

export class RuntimeError extends TypeError {
  name = 'RuntimeError';
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

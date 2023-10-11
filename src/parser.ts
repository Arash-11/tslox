import { TokenType, Token } from './token';
import { Expr, Binary, Unary, Literal, Grouping, Variable, Assign } from './expr';
import { Stmt, Print, Expression, Var } from './stmt';
import { Error, ParseError } from './error';

export default class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.isAtEnd) {
      const declaration = this.declaration();
      if (declaration !== null) statements.push(declaration);
    }

    return statements;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match([TokenType.VAR])) {
        return this.varDeclaration();
      }
      return this.statement();
    } catch (err) {
      if (err instanceof ParseError) {
        this.synchronize();
        return null;
      } else {
        // Unreachable
        throw err;
      }
    }
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    const initializer = this.match([TokenType.EQUAL]) ? this.expression() : null;
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }

  private statement(): Stmt {
    if (this.match([TokenType.PRINT])) return this.printStatement();

    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private expressionStatement(): Stmt {
    const expr  = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.equality();

    if (this.match([TokenType.EQUAL])) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        return new Assign(expr.name, value);
      }

      this.error(equals, 'Invalid assignment target.');
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match([TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL])) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while(this.match([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL])) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match([TokenType.MINUS, TokenType.PLUS])) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match([TokenType.SLASH, TokenType.STAR])) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match([TokenType.BANG, TokenType.MINUS])) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match([TokenType.FALSE])) return new Literal(false);
    if (this.match([TokenType.TRUE])) return new Literal(true);
    if (this.match([TokenType.NIL])) new Literal(null);

    if (this.match([TokenType.NUMBER, TokenType.STRING])) {
      return new Literal(this.previous().literal);
    }

    if (this.match([TokenType.IDENTIFIER])) {
      return new Variable(this.previous());
    }

    if (this.match([TokenType.LEFT_PAREN])) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), 'Expect expression.');
  }

  private match(types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string) {
    if (!this.check(type)) {
      throw this.error(this.peek(), message);
    }

    return this.advance();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd) this.current++;
    return this.previous();
  }

  private get isAtEnd(): boolean {
    return this.peek().type == TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): ParseError {
    Error.error(token, message);
    return new ParseError();
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}

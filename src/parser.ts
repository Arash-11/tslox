import { TokenType, Token } from './token';
import { Expr, Binary, Grouping, Literal, Logical, Unary, Variable, Assign, Call } from './expr';
import { Stmt, Block, Expression, If, Print, Var, While } from './stmt';
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
      if (declaration) statements.push(declaration);
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
    if (this.match([TokenType.FOR])) return this.forStatement();
    if (this.match([TokenType.IF])) return this.ifStatement();
    if (this.match([TokenType.PRINT])) return this.printStatement();
    if (this.match([TokenType.WHILE])) return this.whileStatement();
    if (this.match([TokenType.LEFT_BRACE])) return new Block(this.block());

    return this.expressionStatement();
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt | null;
    if (this.match([TokenType.SEMICOLON])) {
      initializer = null;
    } else if (this.match([TokenType.VAR])) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment: Expr | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();

    if (increment) {
      body = new Block([body, new Expression(increment)]);
    }

    if (!condition) condition = new Literal(true);
    body = new While(condition, body);

    if (initializer) {
      body = new Block([initializer, body]);
    }

    return body;
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch: Stmt | null = null;
    if (this.match([TokenType.ELSE])) elseBranch = this.statement();

    return new If(condition, thenBranch, elseBranch);
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    return new While(condition, body);
  }

  private expressionStatement(): Stmt {
    const expr  = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private block(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd) {
      const declaration = this.declaration();
      if (declaration) statements.push(declaration);
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect ')' after block.");
    return statements;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

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

  private or(): Expr {
    let expr = this.and();

    while (this.match([TokenType.OR])) {
      const operator = this.previous();
      const right = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match([TokenType.AND])) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Logical(expr, operator, right);
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

    while (this.match([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL])) {
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

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match([TokenType.LEFT_PAREN])) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 args.");
        }
        args.push(this.expression());
      } while (this.match([TokenType.COMMA]));
    }

    const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

    return new Call(callee, paren, args);
  }

  private primary(): Expr {
    if (this.match([TokenType.FALSE])) return new Literal(false);
    if (this.match([TokenType.TRUE])) return new Literal(true);
    if (this.match([TokenType.NIL])) return new Literal(null);

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

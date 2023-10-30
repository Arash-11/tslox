import { ExprVisitor, Expr, Binary, Unary, Literal, Logical, Grouping, Variable, Assign, Call } from './expr';
import { StmtVisitor, Stmt, Block, Expression, If, Print, Var, While } from './stmt';
import { Token, TokenType } from './token';
import { Error, RuntimeError } from './error';
import Environment from './environment';
import { LoxCallable } from './LoxCallable';

export default class Interpreter implements ExprVisitor<Object>, StmtVisitor<void> {
  globals = new Environment();
  private environment = this.globals;

  constructor() {
    this.globals.define('clock', new class implements LoxCallable {
      arity(): number { return 0; }

      call(interpreter: Interpreter, args: Object[]): Object {
        return new Date().getTime() / 1000.0;
      }

      toString() { return "<native fn>"; }
    });
  }

  interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (err) {
      if (err instanceof RuntimeError) {
        Error.runtimeError(err);
      } else {
        // Unreachable
        throw err;
      }
    }
  }

  visitBinaryExpr(expr: Binary): Object {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);

      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);

      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);

      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);

      case TokenType.BANG_EQUAL:
        return !Object.is(left, right);

      case TokenType.EQUAL_EQUAL:
        return Object.is(left, right);

      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);

      case TokenType.PLUS:
        if (
          (typeof left === 'number' || left instanceof Number) &&
          (typeof right === 'number' || right instanceof Number)
        ) {
          return Number(left) + Number(right);
        }

        if (
          (typeof left === 'string' || left instanceof String) &&
          (typeof right === 'string' || right instanceof String)
        ) {
          return String(left) + String(right);
        }

        throw new RuntimeError(expr.operator, 'Operands must be two numbers or two strings.');

      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) / Number(right);

      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
    }

    // Unreachable
    return Object(null);
  }

  visitCallExpr(expr: Call): Object {
    const callee = this.evaluate(expr.callee) as LoxCallable;

    const args: Object[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!(callee as LoxCallable)) {
      throw new RuntimeError(expr.paren, 'Can only call functions and classes.');
    }

    const func = callee;
    if (args.length != func.arity()) {
      throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`);
    }
    return func.call(this, args);
  }

  visitGroupingExpr(expr: Grouping): Object {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: Literal): Object {
    if (expr.value === null) {
      return null as unknown as Object;
    }

    return expr.value;
  }

  visitLogicalExpr(expr: Logical): Object {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitUnaryExpr(expr: Unary): Object {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -Number(right);
    }

    // Unreachable
    return Object(null);
  }

  visitVariableExpr(expr: Variable): Object {
    return this.environment.get(expr.name);
  }

  private checkNumberOperand(operator: Token, operand: Object) {
    if (typeof operand === 'number' || operand instanceof Number) return;
    throw new RuntimeError(operator, 'Operand must be a number.');
  }

  private checkNumberOperands(operator: Token, left: Object, right: Object) {
    if (
      (typeof left === 'number' || left instanceof Number) &&
      (typeof right === 'number' || right instanceof Number)
    ) return;

    throw new RuntimeError(operator, 'Operands must be numbers.');
  }

  private evaluate(expr: Expr): Object {
    return expr.accept(this);
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }

  visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression);
  }

  visitIfStmt(stmt: If) {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  visitVarStmt(stmt: Var) {
    const value = stmt.initializer !== null ? this.evaluate(stmt.initializer) : null;
    this.environment.define(stmt.name.lexeme, value);
  }

  visitWhileStmt(stmt: While) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitAssignExpr(expr: Assign): Object {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  private isTruthy(object: Object): boolean {
    if (object === null) return false;
    if (typeof object === 'boolean') return object;
    if (object instanceof Boolean) return Boolean(object);
    return true;
  }

  private stringify(object: Object): string {
    if (object === null) return 'nil';

    if (object instanceof Number) {
      let text = object.toString();
      if (text.endsWith('.0')) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }

    return object.toString();
  }
}

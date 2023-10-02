import { ExprVisitor, Expr, Binary, Unary, Literal, Grouping } from './expr';
import { Token, TokenType } from './token';
import { Error, RuntimeError } from './error';

export default class Interpreter implements ExprVisitor<Object> {
  interpret(expression: Expr) {
    try {
      const value = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (err) {
      if (err instanceof RuntimeError) {
        Error.runtimeError(err);
        return;
      }
      // Unreachable
      throw err;
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

  visitGroupingExpr(expr: Grouping): Object {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: Literal): Object {
    return Object(expr.value);
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

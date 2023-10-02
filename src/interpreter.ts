import { ExprVisitor, Expr, Binary, Unary, Literal, Grouping } from './expr';
import { TokenType } from './token';

export default class Interpreter implements ExprVisitor<Object> {
  visitBinaryExpr(expr: Binary): Object {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        return Number(left) >= Number(right);
      case TokenType.LESS:
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        return Number(left) <= Number(right);
      case TokenType.BANG_EQUAL:
        return !Object.is(left, right);
      case TokenType.EQUAL_EQUAL:
        return Object.is(left, right);
      case TokenType.MINUS:
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
        break;
      case TokenType.SLASH:
        return Number(left) / Number(right);
      case TokenType.STAR:
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
        return -Number(right);
    }

    // Unreachable
    return Object(null);
  }

  private evaluate(expr: Expr): Object {
    return expr.accept(this);
  }

  private isTruthy(object: Object): boolean {
    if (typeof object === 'boolean') return object;
    if (object === null) return false;
    if (object instanceof Boolean) return Boolean(object);
    return true;
  }
}

import { Token } from './token';

interface ExprVisitor<R> {
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
}

export interface Expr {
  accept<R>(visitor: ExprVisitor<R>): R;
}

export class Binary implements Expr {
  constructor(
    public left: Expr,
    public operator: Token,
    public right: Expr
  ) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class Grouping implements Expr {
  constructor(public expression: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal implements Expr {
  constructor(public value: object) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class Unary implements Expr {
  constructor(public operator: Token, public right: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}
import { Expr } from './expr';
import { Token } from './token';

export interface StmtVisitor<R> {
  visitBlockStmt(stmt: Block): R;
  visitClassStmt(stmt: Class): R;
  visitExpressionStmt(stmt: Expression): R;
  visitFunctionStmt(stmt: Function): R;
  visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  visitReturnStmt(stmt: Return): R;
  visitVarStmt(stmt: Var): R;
  visitWhileStmt(stmt: While): R;
}

export interface Stmt {
  accept<R>(visitor: StmtVisitor<R>): R;
}

export class Block implements Stmt {}

export class Class implements Stmt {}

export class Expression implements Stmt {
  constructor(public expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Function implements Stmt {}

export class If implements Stmt {}

export class Print implements Stmt {
  constructor(public expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class Return implements Stmt {}

export class Var implements Stmt {
  constructor(public name: Token, public initializer: Expr | null) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class While implements Stmt {}

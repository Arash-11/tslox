## tslox

TypeScript implementation of the Lox tree-walk interpreter.

### Grammar (represented in a custom Extended Backus-Naur Form)
```
program        → declaration* EOF ;

declaration    → varDecl
               | statement ;

varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;

statement      → exprStmt
               | forStmt
               | ifStmt
               | printStmt
               | whileStmt
               | block ;

exprStmt       → expression ";" ;

forStmt        → "for" "(" ( varDecl | exprStmt | ";" )
                 expression? ";"
                 expression? ")" statement ;

ifStmt         → "if" "(" expression ")" statement
               ( "else" statement )? ;

printStmt      → "print" expression ";" ;

whileStmt      → "while" "(" expression ")" statement ;

block          → "{" declaration* "}" ;



expression     → assignment ;

assignment     → IDENTIFIER "=" assignment
               | logic_or ;

logic_or       → logic_and ( "or" logic_and )* ;

logic_and      → equality ( "and" equality )* ;

equality       → comparison ( ( "!=" | "==" ) comparison )* ;

comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;

term           → factor ( ( "-" | "+" ) factor )* ;

factor         → unary ( ( "/" | "*" ) unary )* ;

unary          → ( "!" | "-" ) unary | call ;

call           → primary ( "(" arguments? ")" )* ;

arguments      → expression ( "," expression )* ;

primary        → "true" | "false" | "nil"
               | NUMBER | STRING
               | "(" expression ")"
               | IDENTIFIER;
```

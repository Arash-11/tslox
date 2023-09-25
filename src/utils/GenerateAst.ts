import fs from 'fs';
import path from 'path';

class GenerateAst {
  static main() {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
      console.error("Usage: generate-ast <output directory>");
      process.exit(64);
    }

    const outputDir = args[0];
    this.defineAst(outputDir, 'Expr', [
      'Binary   - left: Expr, operator: Token, right: Expr',
      'Grouping - expression: Expr',
      'Literal  - value: object',
      'Unary    - operator: Token, right: Expr'
    ]);
  }

  private static defineAst(outputDir: string, baseName: string, types: string[]) {
    const filePath = path.join(outputDir, `${baseName.toLowerCase()}.ts`);

    // Replace content if file already exists
    fs.writeFileSync(filePath, "import Token from './token';\n");

    this.defineVisitor(filePath, baseName, types);

    this.defineAcceptMethod(filePath, baseName);

    // The AST classes
    for (const type of types) {
      const className = type.split('-')[0].trim();
      const fields = type.split('-')[1].trim();
      this.defineType(filePath, baseName, className, fields);
    }
  }

  private static defineVisitor(filePath: string, baseName: string, types: string[]) {
    let fileContent = `\ninterface ${baseName}Visitor<R> {\n`;

    for (const type of types) {
      const typeName = type.split('-')[0].trim();
      fileContent += `  visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;\n`;
    }

    fileContent += '}\n';

    fs.appendFileSync(filePath, fileContent);
  }

  private static defineAcceptMethod(filePath: string, baseName: string) {
    let fileContent = `\ninterface ${baseName} {\n`;
    fileContent    += `  accept<R>(visitor: ${baseName}Visitor<R>): R;\n`;
    fileContent    += '}\n';

    fs.appendFileSync(filePath, fileContent);
  }

  private static defineType(filePath: string, baseName: string, className: string, fieldList: string) {
    let fileContent = `\nclass ${className} implements ${baseName} {\n`

    // Properties
    const fields = fieldList.split(', ');
    for (const field of fields) {
      fileContent += `  ${field};\n`;
    }

    fileContent += '\n';

    // Constructor
    fileContent += `  constructor(${fieldList}) {\n`;

    // Store parameters in fields
    for (const field of fields) {
      const name = field.split(':')[0];
      fileContent += `    this.${name} = ${name};\n`;
    }

    fileContent += '  }\n';

    fileContent += `\n  accept<R>(visitor: ${baseName}Visitor<R>): R {\n`;
    fileContent += `    return visitor.visit${className}${baseName}(this);\n`;
    fileContent += '  }\n';

    fileContent += '}\n';

    fs.appendFileSync(filePath, fileContent);
  }
}

GenerateAst.main();

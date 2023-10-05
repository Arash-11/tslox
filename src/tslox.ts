import fs from 'fs';
import readline from 'readline';
import Scanner from './scanner';
import { Error } from './error';
import Parser from './parser';
import Interpreter from './interpreter';

export default class Tslox {
  private static intrepreter = new Interpreter();

  static main() {
    const args = process.argv.slice(2);
  
    if (args.length > 1) {
      console.log('Usage: tslox [script]');
      process.exit(64);
    } else if (args.length === 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  private static runFile(path: string) {
    const fileContents = fs.readFileSync(path, 'utf-8');
    this.run(fileContents);
  
    // Indicate an error in the exit code.
    if (Error.hadError) process.exit(65);
    if (Error.hadRuntimeError) process.exit(70);
  }

  private static runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });
  
    rl.prompt();
  
    rl.on('line', line => {
      this.run(line);
      Error.hadError = false;
      rl.prompt();
    }).on('close', () => {
      process.exit(0)
    });
  }

  private static run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
  
    const parser = new Parser(tokens);
    const statements = parser.parse();

    // Stop if there was a syntax error
    if (Error.hadError) return;    

    this.intrepreter.interpret(statements);
  }
}

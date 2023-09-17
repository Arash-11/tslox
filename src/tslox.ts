import fs from 'fs';
import readline from 'readline';
import { tokens } from './types.js';
import Scanner from './Scanner.js';
import Error from './error.js';

export default class Tslox {
  static main() {
    const args = process.argv.slice(2);
  
    if (args.length > 1) {
      console.log("Usage: tslox [script]");
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
    const tokens: tokens = scanner.scanTokens();
  
    // For now, just print the tokens.
    for (const token of tokens) {
      console.log(token);
    }
  }
}

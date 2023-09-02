import fs from 'fs';
import readline from 'readline';

let hadError = false;

function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}

function error(line: number, message: string) {
  report(line, '', message);
}

function scanTokens(source: string): Token[] {}

function run(source: string) {
  const tokens: Token[] = scanTokens(source);

  // For now, just print the tokens.
  for (const token of tokens) {
    console.log(token);
  }
}

function runFile(path: string) {
  const fileContents = fs.readFileSync(path, 'utf-8');
  run(fileContents);

  // Indicate an error in the exit code.
  if (hadError) process.exit(65);
}

function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  rl.prompt();

  rl.on('line', line => {
    run(line);
    hadError = false;
    rl.prompt();
  }).on('close', () => {
    process.exit(0)
  });
}

function main() {
  const args = process.argv.slice(2);

  if (args.length > 1) {
    console.log("Usage: tslox [script]");
    process.exit(64);
  } else if (args.length === 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

main();

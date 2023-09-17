export default class Error {
  static hadError = false;

  static error(line: number, message: string) {
    Error.report(line, '', message);
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    Error.hadError = true;
  }
}
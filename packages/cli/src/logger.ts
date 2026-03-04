import pc from 'picocolors';

const PREFIX = pc.cyan('[rwasm]');

export const log = {
  info(msg: string) {
    console.log(`${PREFIX} ${msg}`);
  },
  success(msg: string) {
    console.log(`${PREFIX} ${pc.green(msg)}`);
  },
  warn(msg: string) {
    console.warn(`${PREFIX} ${pc.yellow(msg)}`);
  },
  error(msg: string) {
    console.error(`${PREFIX} ${pc.red(msg)}`);
  },
  step(msg: string) {
    console.log(`${PREFIX} ${pc.dim('→')} ${msg}`);
  },
};

import { spawn } from 'node:child_process';
import process from 'node:process';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const processes = [
  spawn(npmCmd, ['run', 'dev:api'], { stdio: 'inherit', shell: isWin }),
  spawn(npmCmd, ['run', 'dev:web'], { stdio: 'inherit', shell: isWin }),
];

function shutdown(signal) {
  for (const child of processes) {
    if (child && !child.killed && child.pid) {
      if (isWin) {
        try {
          spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F'], { shell: true });
        } catch {
          child.kill(signal);
        }
      } else {
        child.kill(signal);
      }
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

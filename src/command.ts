import { spawn, exec } from 'child_process';
import logger from './logger';


export async function runCommand(command: string, args: string[]) {
    return new Promise((resolve, reject) => {
        const build = spawn(command, args);

        build.stdout.on('data', (data) => {
            logger.debug(data.toString());
        });

        build.stderr.on('data', (data) => {
            logger.error(data.toString());
        });

        build.on('exit', (code) => {
            logger.debug(`${command} exited with code ${code}`);
            if (code === 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
}

export function diff(commitHash: string) {
    return new Promise((resolve, reject) => {
        exec(`git diff --dirstat=files,0 ${commitHash} | sed 's/^[ 0-9.]\\+% //g'`, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.split('\n').filter((line) => {
                const trimmedLine = line.trim();
                if (trimmedLine) return trimmedLine;
            }));
        });
    });
}

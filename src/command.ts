import {spawn} from 'child_process';
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


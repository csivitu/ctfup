import { Command } from 'commander';
import logger from './logger';
import {Challenges} from './challenges';
import {Deployer} from './deploy';
import {parseConfig, getConfig} from './config';

async function main() {
    const program = new Command();
    let dir: string = "";
    program
        .version('0.0.1')
        .arguments('[dir]')
        .requiredOption('-c, --config <config>', 'deployment configuration')
        .action((arg) => {
            dir = arg;
        });

    program.parse(process.argv);

    if (dir === undefined) {
        logger.debug('Directory not passed, using current directory by default');
        dir = '.';
    }

    await parseConfig(program.config);

    const config = getConfig();
    const challenges = await Challenges.parse(dir, config.categories);
   
    const deployer = new Deployer();
    for (const challenge of challenges.challenges) {
        if (challenge.type === 'hosted') {
            await deployer.buildChallenge(challenge);
        }
    }
}


main();

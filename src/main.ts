#!/usr/bin/env node

import { Command } from 'commander';
import logger from './logger';
import { Challenges } from './challenges';
import { Deployer } from './deploy';
import { parseConfig, getConfig } from './config';

async function main() {
    const program = new Command();
    let dir: string = '';
    program
        .version('0.0.1')
        .arguments('[dir]')
        .requiredOption('-c, --config <config>', 'deployment configuration')
        .option('-d, --diff <commit-id>', 'deploy challenges which were changed from the specified commit-hash')
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
    const options = { diff: program.diff };
    const challenges = await Challenges.parse(dir, config.categories, options);

    logger.debug(challenges);

    const deployer = new Deployer();

    challenges.challenges.forEach(async (challenge) => {
        if (challenge.type === 'hosted') {
            await deployer.buildChallenge(challenge);
            await deployer.deployChallenge(challenge);
        }
    });
}

main();

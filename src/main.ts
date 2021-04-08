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
        .option('-bo, --build-only', 'only build and push docker containers, don\'t deploy to kubernetes')
        .action((arg) => {
            dir = arg;
        });

    program.parse(process.argv);

    if (dir === undefined) {
        logger.debug('Directory not passed, using current directory by default');
        dir = '.';
    }

    const options = { diff: program.diff, buildOnly: program.buildOnly };

    await parseConfig(program.config);
    const config = getConfig();

    // The category folder name is sent to Kubernetes for a label
    // It has to start with a letter and contain only letter, numbers and dashes
    for (const category of config.categories) {
        if (!category.match(/^[a-zA-Z][A-Za-z0-9_-]+$/)) {
            logger.error('The category folder name must start with a letter and can only contain letters, numbers and dashes');
            logger.error(`"${category}" not valid`);
            process.exit(1);
        }
    }

    const challenges = await Challenges.parse(dir, config.categories, options);

    logger.debug(challenges);

    const deployer = new Deployer();

    for (const challenge of challenges.challenges) {
        if (challenge.type === 'hosted') {
            await Deployer.buildChallenge(challenge);
            if (!options.buildOnly) {
                await deployer.deployChallenge(challenge);
            }
        }
    }
}

main();

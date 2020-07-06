import fs from 'fs-extra';
import path from 'path';

import {Challenge} from './challenge';
import logger from './logger';


export class Challenges {
    challenges: Challenge[];
    constructor(challenges: Challenge[]) {
        this.challenges = challenges;
    }

    static async parse(dir: string, categories: string[]) {
        let challengePromises: Promise<Challenge>[] = [];
        await Promise.all(categories.map(async (c) => {
            const categoryFolder = path.join(dir, c);
            logger.debug(`Parsing category ${categoryFolder}`);
            await Promise.all(
                (await fs.readdir(categoryFolder)).map(async (folder) => {
                    const challengeFolder = path.join(categoryFolder, folder);
                    if ((await fs.stat(challengeFolder)).isDirectory()) {
                        logger.debug(`Parsing challenge ${folder}`);
                        challengePromises.push(
                            Challenge.parse(challengeFolder)
                        );
                    }
                })
            );
        }));

        return new Challenges(await Promise.all(challengePromises));
    }
}

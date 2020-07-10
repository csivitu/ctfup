import fs from 'fs-extra';
import path from 'path';

import { Challenge } from './challenge';
import { diff } from './command';
import logger from './logger';

interface Options {
    diff: string;
}

export class Challenges {
    challenges: Challenge[];
    constructor(challenges: Challenge[]) {
        this.challenges = challenges;
    }

    static async parse(dir: string, categories: string[], options?: Options) {
        let challengePromises: Promise<Challenge>[] = [];

        let modifiedChallenges: Array<string> = [];
        if (options && options.diff) {
            modifiedChallenges = await diff(options.diff);
        }

        await Promise.all(categories.map(async (c) => {
            const categoryFolder = path.join(dir, c);
            logger.debug(`Parsing category ${categoryFolder}`);
            
            await Promise.all(
                (await fs.readdir(categoryFolder)).map(async (folder) => {
                    const challengeFolder = path.join(categoryFolder, folder);

                    if ((await fs.stat(challengeFolder)).isDirectory()) {
                        if (options && options.diff && modifiedChallenges.length) {
                            if (modifiedChallenges.filter((chall) => chall.includes(challengeFolder)).length) {
                                logger.debug(`Parsing challenge ${folder}`);
                                challengePromises.push(
                                    Challenge.parse(challengeFolder)
                                );
                            }
                        } else {
                            logger.debug(`Parsing challenge ${folder}`);
                            challengePromises.push(
                                Challenge.parse(challengeFolder)
                            );
                        }
                    }
                })
            );
        }));

        return new Challenges(await Promise.all(challengePromises));
    }
}

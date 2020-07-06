import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import logger from './logger';

interface PortMapping {
    containerPort: number;
    serverPort: number;
}

interface Conf {
    name: string;
    category: string;
    ports: PortMapping[]
}

type ChallengeType = 'hosted' | 'non-hosted'

export class Challenge {
    conf: Conf;
    dir: string;
    type: ChallengeType;
    constructor(dir: string, conf: Conf, type: ChallengeType) {
        this.dir = dir;
        this.conf = conf;
        this.type = type;
    }


    static async parse(dir: string) {
        const ymlPath = path.join(dir, 'challenge.yml');
        let type: ChallengeType;
        let conf: Conf;

        if (await fs.pathExists(ymlPath)) {
            conf = yaml.parse(await fs.readFile(ymlPath, 'utf8')) as Conf;
            if (await fs.pathExists(path.join(dir, 'Dockerfile'))) { 
                type = 'hosted';
            } else {
                type = 'non-hosted';
            }
        } else {
            logger.warn(`Challenge ${dir} does not have a yml file!`)
            conf = {
                name: '',
                category: '',
                ports: [],
            };
            type = 'non-hosted';
        }


        logger.debug(`
                     Parsed ${dir}:
                         Name: ${conf.name}
                         Category: ${conf.category}
                     `);

        return new Challenge(dir, conf, type);
    }
}

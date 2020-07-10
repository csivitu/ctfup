import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import logger from './logger';
import { getConfig, ResourceConstraints } from './config';

interface PortMapping {
    containerPort: number;
    nodePort?: number;
}

interface Container {
    image?: string;
    ports?: PortMapping[];
    build?: string;
    env?: { [key: string]: string }
    resources?: ResourceConstraints;
}

interface Conf {
    name: string;
    category: string;
    expose?: PortMapping[];
    containers?: { [name: string]: Container };
    replicas?: number;
}

type ChallengeType = 'hosted' | 'non-hosted';

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

        const defaults = getConfig().resources;

        if (await fs.pathExists(ymlPath)) {
            conf = yaml.parse(await fs.readFile(ymlPath, 'utf8')) as Conf;
            if (conf.containers) {
                type = 'hosted';
                for (const name in conf.containers) {
                    const container = conf.containers[name];
                    if (!container.resources && defaults) {
                        container.resources = defaults;
                    }
                }
            } else {
                type = 'non-hosted';
            }
        } else {
            logger.warn(`Challenge ${dir} does not have a yml file!`);
            conf = {
                name: '',
                category: '',
            };
            type = 'non-hosted';
        }

        conf.name = conf.name.toLowerCase().replace(/\s/g, '-');
        logger.debug(`
                     Parsed ${dir}:
                         Name: ${conf.name}
                         Category: ${conf.category}
                     `);

        return new Challenge(dir, conf, type);
    }
}

export default Challenge;

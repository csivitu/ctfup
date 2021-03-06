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
    namespace?: string;
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
        // The challenge folder name is sent to Kubernetes for a label
        // It has to start with a letter and contain only letter, numbers and dashes
        if (!path.basename(dir).match(/^[a-zA-Z][A-Za-z0-9_-]+$/)) {
            logger.error('The challenge folder name must start with a letter and can only contain letters, numbers and dashes');
            logger.error(`"${dir}" not valid`);
            process.exit(1);
        }

        const ymlPath = path.join(dir, 'challenge.yml');
        let type: ChallengeType;
        let conf: Conf;

        const defaults = getConfig();

        if (await fs.pathExists(ymlPath)) {
            conf = yaml.parse(await fs.readFile(ymlPath, 'utf8')) as Conf;
            conf.name = path.basename(dir);
            conf.category = path.basename(path.dirname(dir));
            if (conf.containers) {
                type = 'hosted';
                for (const name in conf.containers) {
                    const container = conf.containers[name];
                    if (!container.resources && defaults.resources) {
                        container.resources = defaults.resources;
                    }
                }
                if (!conf.namespace && defaults.namespace) {
                    conf.namespace = defaults.namespace;
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

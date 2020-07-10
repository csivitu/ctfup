import * as k8s from '@kubernetes/client-node';
import path from 'path';
import hb from 'handlebars';
import fs from 'fs';
import yaml from 'yaml';

import { Challenge } from './challenge';
import logger from './logger';
import { Docker } from './docker';
import { getConfig } from './config';
import { getHash } from './command';

const configFolder = path.resolve(__dirname, '..', 'config');
const deploymentConfig = hb.compile(fs.readFileSync(
    path.join(configFolder, 'deployment.yml'),
    'utf8',
));

export class Deployer {
    api: k8s.KubernetesObjectApi;

    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.api = k8s.KubernetesObjectApi.makeApiClient(kc);
    }

    static async buildChallenge(chall: Challenge) {
        const config = getConfig();
        const challenge = chall;
        const imageName = challenge.conf.image || `${config.registry}/${challenge.conf.name}:${getHash()}`;

        challenge.conf.image = imageName;
        logger.debug(`Building ${challenge.conf.name}`);
        await Docker.build(challenge.dir, imageName);
        logger.debug(`Built ${challenge.conf.name} successfully`);

        logger.debug(`Pushing ${challenge.conf.name} to registry`);
        await Docker.push(imageName);
        logger.debug(`Pushed ${challenge.conf.name} successfully`);
    }

    async deployChallenge(challenge: Challenge) {
        const k8Conf = yaml.parseAllDocuments(deploymentConfig(challenge.conf));

        k8Conf.forEach(async (conf) => {
            logger.info(`Deploying ${challenge.conf.name}`);
            logger.debug(conf.toJSON());
            await this.apply(conf.toJSON());
        });
    }

    async apply(conf: any) {
        try {
            await this.api.read(conf);
            logger.info(`k8 ${conf.kind}: ${conf.metadata.name} already exists. Patching...`);
            try {
                await this.api.patch(conf);
            } catch (e) {
                logger.info(`Failed to patch ${conf.kind}: ${conf.metadata.name}. Trying to delete and re-create (YOLO).`);
                await this.api.delete(conf);
                await this.api.create(conf);
            }
        } catch (e) {
            logger.info(`k8 ${conf.kind}: ${conf.metadata.name} does not exist. Creating...`);
            await this.api.create(conf);
        }
    }
}

export default Deployer;

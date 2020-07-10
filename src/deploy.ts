import * as k8s from '@kubernetes/client-node';
import path from 'path';
import hb from 'handlebars';
import fs from 'fs';
import yaml from 'yaml';

import {Challenge} from './challenge';
import logger from './logger';
import {Docker} from './docker';
import {getConfig} from './config';
import {getHash} from './command';

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

    async buildChallenge(challenge: Challenge) {
        if (!challenge.conf.containers) {
            return;
        }
        const config = getConfig();
        for (const name in challenge.conf.containers) {
            const container = challenge.conf.containers[name];
            if (!container.build) {
                return;
            }
            const imageName = `${config.registry}/${challenge.conf.name}-${name}:${await getHash()}`;

            logger.debug(`Building ${challenge.conf.name}`);
            await Docker.build(path.join(challenge.dir, container.build), imageName);
            logger.debug(`Built ${challenge.conf.name} successfully`);

            logger.debug(`Pushing ${challenge.conf.name} to registry`);
            await Docker.push(imageName);
            logger.debug(`Pushed ${challenge.conf.name} successfully`);
            container.image = imageName;
        }
    }

    async deployChallenge(challenge: Challenge) {
        const k8Conf = yaml.parseAllDocuments(deploymentConfig(challenge.conf));

        k8Conf.forEach(async (conf) => {
            logger.info(`Deploying ${challenge.conf.name}`);
            logger.debug(JSON.stringify(conf.toJSON(), null, 4));
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

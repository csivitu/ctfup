import * as k8s from '@kubernetes/client-node';
import {Challenge} from './challenge';
import logger from './logger';
import {Docker} from './docker';
import {getConfig} from './config';



export class Deployer {
    api: k8s.CoreV1Api;
    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.api = kc.makeApiClient(k8s.CoreV1Api);
    }

    async buildChallenge(challenge: Challenge) {
        const config = getConfig();
        console.log(challenge.conf.name);
        const imageName = `${config.registry}/${challenge.conf.name.toLowerCase().replace(/\s/g, '-')}:latest`;
        logger.debug(`Building ${challenge.conf.name}`);
        await Docker.build(challenge.dir, imageName);
        logger.debug(`Built ${challenge.conf.name} sucesfully`);

        logger.debug(`Pushing ${challenge.conf.name} to registry`);
        await Docker.push(imageName);
        logger.debug(`Pushed ${challenge.conf.name} sucessfully`);
    }
}

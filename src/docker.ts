import { runCommand } from './command';

export class Docker {
    static async build(context: string, tag: string) {
        return runCommand('docker', ['build', '-t', tag, context]);
    }

    static async push(tag: string) {
        return runCommand('docker', ['push', tag]);
    }
}

export default Docker;

import {makeDataSet} from './dataset.ts';
import {log, LogLv} from './util.ts';
import * as workflow from './workflow.ts';

const ACTIONS = {
    CHOOSE: 'choose',
    DETAILS: 'details',
    SET: 'set',
    STATS: 'stats',
    UPDATE: 'update',
};

async function main() {
    const [action, param] = process.argv.slice(2);
    log(LogLv.debug, action, param);
    let todo: () => Promise<unknown>;
    switch (action) {
        case ACTIONS.CHOOSE:
            todo = () => workflow.chooseNext();
            break;
        case ACTIONS.DETAILS:
            todo = () => workflow.details(param);
            break;
        case ACTIONS.SET:
            todo = () => workflow.setNext(param);
            break;
        case ACTIONS.STATS:
            todo = () => Promise.resolve(workflow.stats());
            break;
        case ACTIONS.UPDATE:
            todo = () => makeDataSet();
            break;
        default:
            todo = () => Promise.resolve(console.log('unknown action'));
            break;
    }
    await todo();
    process.exit();
}

await main();

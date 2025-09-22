import {makeDataSet} from './dataset.ts';
import {log, LogLv} from './util.ts';
import * as workflow from './workflow.ts';

const ACTIONS = {
    CHOOSE: 'choose',
    DETAILS: 'details',
    SET: 'set',
    STATS: 'stats',
    UPDATE: 'update',
    VENUES: 'venues',
};

async function main() {
    const [action, param] = process.argv.slice(2);
    log(LogLv.debug, action, param);
    let todo: Function;
    switch (action) {
        case ACTIONS.CHOOSE:
            const p = Number(param);
            todo = () => workflow.chooseNext(p);
            break;
        case ACTIONS.DETAILS:
            todo = () => workflow.details(param);
            break;
        case ACTIONS.SET:
            todo = () => workflow.setNext(param);
            break;
        case ACTIONS.STATS:
            todo = () => workflow.stats();
            break;
        case ACTIONS.UPDATE:
            todo = () => makeDataSet();
            break;
        case ACTIONS.VENUES:
            todo = () => workflow.venues();
            break;
        default:
            todo = () => console.log('unknown action');
            break;
    }
    await todo();
    process.exit();
}

await main();

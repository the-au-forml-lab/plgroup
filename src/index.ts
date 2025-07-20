import {makeDataSet, details} from './dataset.ts';
import {log, LogLv} from './util.ts';
import {setNext, chooseNext, stats} from './workflow.ts';

const ACTIONS = {
    CHOOSE: 'choose',
    DETAILS: 'details',
    SET: 'set',
    STATS: 'stats',
    UPDATE: 'update',
}


const main = async () => {
    const [action, param] = process.argv.slice(2);
    log(LogLv.debug, action, param);
    let todo: Function;
    switch (action) {
        case(ACTIONS.CHOOSE):
            todo = (() => chooseNext());
            break;
        case (ACTIONS.DETAILS):
            todo = (() => details(param));
            break;
        case (ACTIONS.SET):
            todo = (() => setNext(param));
            break;
        case (ACTIONS.STATS):
            todo = (() => stats());
            break;
        case(ACTIONS.UPDATE):
            todo = (() => makeDataSet(Boolean(param)));
            break;
        default:
            todo = (() => console.log('Unknown action'));
            break;
    }
    await todo();
    process.exit();
};

await main();

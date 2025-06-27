import {Paper, loadPapers, fetchDetails, makeDataSet} from './dataset.js';
import {LogLv, log} from './util.js';
import {setNext, chooseNext} from './workflow.js';

function stats(): void{
    const papers: Paper[] = Object.values(loadPapers());
    const venues: string[] = papers.map(p => p.venue);

    // count using a hash map;
    // while we're at it, accumulate the total number of papers and
    // a width for displaying later
    const counter: {[_:string]: number} = {};
    let width = 0;
    let total = 0;
    venues.forEach(v => {
        counter[v] = counter[v] ? counter[v] + 1 : 1;
        total++;
        width = Math.max(width, v.length + 3);
    });

    // sort low to high
    const sorted: Array<[string, number]> =
        Object.keys(counter).map(k => [k, counter[k]]);
    sorted.sort(([,n], [,m]) => n - m);

    const printLine = (s: string, num: number) =>
        console.log(
            (s + ' ').padEnd(width, '.'),
            num.toString().padStart(3, ' '));

    for(const line of sorted){
        printLine(...line);
    }
    printLine('TOTAL', total);
}

async function details(doi: string): Promise<void>{
    console.table(await fetchDetails({doi}));
}

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
            todo = stats;
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

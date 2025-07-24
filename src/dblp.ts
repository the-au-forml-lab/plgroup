import {FILES} from './config.ts';
import {readUrl} from './request.ts';
import {all, log, LogLv, FileSystem} from './util.ts';
    
export const DBLP_DOMAINS = [
    'https://dblp.org',
    'https://dblp.uni-trier.de',
];


// This mostly exists for documentation purposes, so that the shape of a
// responses from the DBLP API is known. In practice the code doesn't use most
// of the fields. The author field either contains the author of a single-author
// paper or an array of authors for multi-author papers.
// 
// Note also that:
// 1. This interface was designed by DBLP, not by me.
// 2. The API does not seem to be locked in, and is subject to change.

interface DblpApiResponse {
    authors: {
        author: {text:string, '@pid': string}
            | Array< {text:string, '@pid': string}>
    },
    title: string,
    venue: string,
    volume: string,
    number: string,
    pages: string,
    year: string,
    type: string,
    key: string,
    doi: string
    url: string,
}

function isPaper(info: DblpApiResponse): boolean {
    const tests: boolean[] = [
        /paper|article/i.test(info.type),
        /\d+-\d+/.test(info.pages),
    ]
    if(all(tests)) {
        return true;
    } else {
        log(LogLv.verbose, `Rejecting hit ${JSON.stringify(info, undefined, 2)}`);
        return false;
    }
}

interface DblpHit {
    info: DblpApiResponse
};

export class DblpPrePaper {
    readonly doi: string;
    readonly title: string;
    readonly venue: string;

    // construct objects of this type from `DblpInfo`s.
    private constructor(doi: string, title: string, venue: string) {
        this.doi = doi;
        this.title = title;
        this.venue = venue;
    }

    static parse(info: DblpApiResponse, venue: DblpVenue) {
        const {doi, title} = info;
        if(!doi || !title) {
            throw new Error('Malformed DBLP Hit:\n'
                + JSON.stringify(info, undefined, 2));
        }
        return new DblpPrePaper(doi, title, venue.toString());
    }
}

class DblpVenue {
    readonly name: string;
    readonly year: number;
    constructor(name: string, year: number) {
        this.name = name;
        this.year = year;
    }

    toString() {
        return `${this.name} ${this.year}`;
    }

    apiUrl(domain: string): string {
        const path = '/search/publ/api';
        const searchParams = new URLSearchParams( {
            q: `stream:conf/${this.name}: year:${this.year}`,
            format: 'json',
            h: '1000',
        });
        return `${domain}${path}?${searchParams}`;
    }

    async callApi(): Promise<string> {
        const calls = DBLP_DOMAINS
            .map(domain => this.apiUrl(domain))
            .map(url => readUrl(url));
        try {
            return await Promise.any(calls);
        } catch (e) {
            log(LogLv.error, `All DBLP endpoints failed for ${this}`);
            throw e;
        }
    }

    async getHits(): Promise<DblpPrePaper[]> {
        const json = JSON.parse(await this.callApi());
        const hits: DblpHit[] = json?.result?.hits?.hit;
        log(LogLv.normal, `Fetching papers from DBLP venue ${this}`);
        if(!Array.isArray(hits)) {
            throw new Error(`Malformed response from DBLP venue ${this}`);
        }
        const filtered = hits
            .map(({info}) => info)
            .filter(info => isPaper(info));
        log(LogLv.normal,
            `...got ${hits.length} hits from ${this}: ${filtered.length} good and ${hits.length-filtered.length} rejected`);
        try {
                return filtered.map(info => DblpPrePaper.parse(info, this));
        } catch (e) {
            log(LogLv.error,`Failed to parse hit from venue ${this}`);
            throw e;
        }
    }
}

export function loadVenues(): DblpVenue[] {
    return FileSystem.readLines(FILES.VENUES).map(line => parseVenue(line));
}

function parseVenue(s: string): DblpVenue {
    const format = /^[a-zA-Z]+,\d+$/;
    if (!format.test(s)) {
        throw new Error(`Failed to parse venue entry ${s}`);
    }
    const [name,year] = s.split(',');
    return new DblpVenue(name, Number.parseInt(year));
}

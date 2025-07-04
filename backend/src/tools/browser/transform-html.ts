import { JSDOM } from 'jsdom';
import { collectFormElements } from './collect-form-elements';
import { stripHtml } from './strip-html';
import { summarizeHtml } from './summarize-html';
import { collectLinkElements } from './collect-link-elements';
import { filterLinkElements } from './filter-link-elements';

export async function transformHtml(html: string) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const formElements = collectFormElements(document);
    const links = collectLinkElements(document);
    const filteredLinks = await filterLinkElements(links);
    const strippedHtml = stripHtml(document);

    const summarizedHtml = await summarizeHtml(strippedHtml);

    return {
        summarizedHtml,
        formElements,
        links: filteredLinks,
    };
}


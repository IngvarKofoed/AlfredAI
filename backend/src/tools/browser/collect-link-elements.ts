export interface LinkElementData {
    url: string;
    text: string | undefined;
    title: string | undefined;
    ariaLabel: string | undefined;
}

export function collectLinkElements(document: Document): LinkElementData[] {
    const linkElements = document.querySelectorAll('a[href]');
    const linkDataMap = new Map<string, LinkElementData>();

    linkElements.forEach((link) => {
        // Check if the link is visible (JSDOM compatible)
        const htmlLink = link as HTMLElement;
        const style = htmlLink.style;
        const computedStyle = htmlLink.getAttribute('style') || '';
        
        // Check for common visibility hiding patterns
        const isHidden = style.display === 'none' || 
                        style.visibility === 'hidden' || 
                        style.opacity === '0' ||
                        computedStyle.includes('display: none') ||
                        computedStyle.includes('visibility: hidden') ||
                        computedStyle.includes('opacity: 0') ||
                        htmlLink.hasAttribute('hidden') ||
                        htmlLink.classList.contains('hidden') ||
                        htmlLink.classList.contains('invisible');

        if (isHidden) {
            return;
        }

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) {
            return;
        }

        // Create a unique key based on URL and text to avoid duplicates
        const text = link.textContent?.trim() || '';
        const uniqueKey = `${href}|${text}`;

        if (linkDataMap.has(uniqueKey)) {
            return;
        }

        const linkData: LinkElementData = {
            url: href,
            text: text || undefined,
            title: link.getAttribute('title') || undefined,
            ariaLabel: link.getAttribute('aria-label') || undefined
        };

        linkDataMap.set(uniqueKey, linkData);
    });

    return Array.from(linkDataMap.values());
}
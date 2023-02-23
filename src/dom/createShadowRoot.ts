/**
 * An extension of HTMLDivElement that represents a shadow root for use within an Extension Content Script.
 */
interface ExtShadowDOM extends HTMLDivElement {
    shadowRoot: ShadowRoot;
    /**
     * Adds a style sheet to the shadow root.
     * @param path the path to the style sheet relative to the extension's root directory. uses chrome.runtime.getURL to get the absolute path.
     */
    addStyle(path: string): Promise<void>;
}

/**
 * In extension content scripts, often times the parent site's styles will override the styles of the extension.
 * To get around this, we create a shadow DOM and isolate the extension's html and styles in the shadow DOM.
 * from the parent site's styles to prevent conflicts.
 * @param id the id of the shadow root.
 * @param options the optional options for the shadow root.
 * @returns A Div that represents the shadow root with some additional methods added to it.
 */
export function createShadowDOM(id: string, options?: ShadowRootInit): ExtShadowDOM {
    const html = document.querySelector('html');
    if (!html) {
        throw new Error('Could not find html element');
    }
    const div = document.createElement('div') as ExtShadowDOM;
    div.id = id;
    div.style.all = 'initial';
    div.attachShadow({
        mode: 'open',
        ...(options || {}),
    });

    div.addStyle = async function (path: string) {
        const style = await fetch(chrome.runtime.getURL(path));
        const styleNode = document.createElement('style');
        const parsedStyle = await style.text();
        styleNode.textContent = parsedStyle;
        this.shadowRoot.appendChild(styleNode);
    };

    html.appendChild(div);
    return div as ExtShadowDOM;
}

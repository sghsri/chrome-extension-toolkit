export enum ScriptType {
    CONTENT_SCRIPT = 'content_script',
    BACKGROUND_SCRIPT = 'background_script',
    EXTENSION_POPUP = 'extension_popup',
    EXTENSION_PAGE = 'extension_page',
}

export function getScriptType(): ScriptType | null {
    if (!chrome.runtime.id) {
        // we are not in a chrome extension
        return null;
    }
    const manifest = chrome.runtime.getManifest();
    if (window === undefined) {
        return ScriptType.BACKGROUND_SCRIPT;
    }

    if (window.location.href.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
        if (manifest.action?.default_popup && window.location.href.includes(manifest.action.default_popup)) {
            return ScriptType.EXTENSION_POPUP;
        }
        return ScriptType.EXTENSION_PAGE;
    }

    return ScriptType.CONTENT_SCRIPT;
}

export function isContentScript(): boolean {
    return getScriptType() === ScriptType.CONTENT_SCRIPT;
}

export function isBackgroundScript(): boolean {
    return getScriptType() === ScriptType.BACKGROUND_SCRIPT;
}

export function isExtensionPopup(): boolean {
    return getScriptType() === ScriptType.EXTENSION_POPUP;
}

export function isExtensionPage(): boolean {
    return getScriptType() === ScriptType.EXTENSION_PAGE;
}

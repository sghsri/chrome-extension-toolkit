import getScriptType, {
    isBackgroundScript,
    isContentScript,
    isExtensionPage,
    isExtensionPopup,
    ScriptType,
} from 'src/getScriptType';
import { chrome } from 'jest-chrome';
import TestData from 'test/TestData';

describe('getScriptType', () => {
    it('should return null if not in a chrome extension', () => {
        // in a normal node environment, chrome.runtime.id is undefined, so getScriptType should return null
        expect(getScriptType()).toBeNull();
    });

    describe('in a chrome extension', () => {
        beforeAll(() => {
            chrome.runtime.getManifest.mockReturnValue(TestData.manifest);
            // @ts-ignore
            chrome.runtime.id = TestData.extensionId;
        });

        describe('should handle background script', () => {
            beforeAll(() => {
                // @ts-ignore
                jest.spyOn(global, 'window', 'get').mockReturnValue(undefined);
            });

            it('should return background script when in service worker', () => {
                expect(getScriptType()).toBe(ScriptType.BACKGROUND_SCRIPT);
            });

            it('background helper should return true when in service worker', () => {
                expect(isBackgroundScript()).toBe(true);
            });

            afterAll(() => {
                jest.spyOn(global, 'window', 'get').mockRestore();
            });
        });

        describe('should handle extension popup', () => {
            beforeAll(() => {
                // @ts-ignore
                jest.spyOn(window, 'location', 'get').mockReturnValue({
                    href: `chrome-extension://${TestData.extensionId}/${TestData.manifest.action.default_popup}`,
                });
            });

            it('should return extension popup when in extension popup', () => {
                expect(getScriptType()).toBe(ScriptType.EXTENSION_POPUP);
            });

            it('extension popup helper should return true when in extension popup', () => {
                expect(isExtensionPopup()).toBe(true);
            });
        });

        describe('should handle extension pages', () => {
            beforeAll(() => {
                // @ts-ignore
                jest.spyOn(window, 'location', 'get').mockReturnValue({
                    href: `chrome-extension://${TestData.extensionId}/index.html`,
                });
            });

            it('should return extension page when in extension page', () => {
                expect(getScriptType()).toBe(ScriptType.EXTENSION_PAGE);
            });

            it('extension page helper should return true when in extension page', () => {
                expect(isExtensionPage()).toBe(true);
            });
        });

        describe('should handle content scripts', () => {
            beforeAll(() => {
                // @ts-ignore
                jest.spyOn(window, 'location', 'get').mockReturnValue({
                    href: 'https://www.google.com/',
                });
            });

            it('should return content script when in content script', () => {
                expect(getScriptType()).toBe(ScriptType.CONTENT_SCRIPT);
            });

            it('content script helper should return true when in content script', () => {
                expect(isContentScript()).toBe(true);
            });
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });
});

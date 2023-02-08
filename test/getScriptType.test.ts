import getScriptType, { ScriptType } from 'src/getScriptType';
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

        it('should return background script when in service worker', () => {
            // service workers don't have a window object
            // @ts-ignore
            jest.spyOn(global, 'window', 'get').mockReturnValue(undefined);

            expect(getScriptType()).toBe(ScriptType.BACKGROUND_SCRIPT);

            jest.spyOn(global, 'window', 'get').mockRestore();
        });

        it('should return extension popup when in extension popup', () => {
            // @ts-ignore
            jest.spyOn(window, 'location', 'get').mockReturnValue({
                href: `chrome-extension://${TestData.extensionId}/${TestData.manifest.action.default_popup}`,
            });

            expect(getScriptType()).toBe(ScriptType.EXTENSION_POPUP);
        });

        describe('should handle extension pages', () => {
            it('should return extension page when in extension page', () => {
                // @ts-ignore
                jest.spyOn(window, 'location', 'get').mockReturnValue({
                    href: `chrome-extension://${TestData.extensionId}/index.html`,
                });

                expect(getScriptType()).toBe(ScriptType.EXTENSION_PAGE);
            });

            it('should return extension page when in extension page with query params', () => {
                // @ts-ignore
                jest.spyOn(window, 'location', 'get').mockReturnValue({
                    href: `chrome-extension://${TestData.extensionId}/index.html?param1=value1&param2=value2`,
                });

                expect(getScriptType()).toBe(ScriptType.EXTENSION_PAGE);
            });
        });

        it('should return content script when in content script', () => {
            // @ts-ignore
            jest.spyOn(window, 'location', 'get').mockReturnValue({
                href: 'https://www.google.com/',
            });

            expect(getScriptType()).toBe(ScriptType.CONTENT_SCRIPT);
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });
});

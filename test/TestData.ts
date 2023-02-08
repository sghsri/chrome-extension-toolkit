const manifest = {
    name: 'Test Extension',
    version: '1.0.0',
    background: {
        service_worker: 'background.js',
    },
    action: {
        default_popup: 'popup.html',
    },
    content_scripts: [
        {
            matches: ['https://www.google.com/*'],
            js: ['content.js'],
        },
    ],
    permissions: ['tabs', 'storage'],
    manifest_version: 3,
} satisfies chrome.runtime.ManifestV3;

const extensionId: string = 'phgkhafplagdfjkjjjfaockladkcpbld';

export default { manifest, extensionId };

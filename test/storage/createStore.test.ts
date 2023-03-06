import { createStore } from 'src/storage';

describe('createStore', () => {
    it('should create a store', async () => {
        const store = createStore('TEST_STORE', {
            foo: 'bar',
        });

        expect(store).toBeDefined();
    });

    it('should create the setters and getters', async () => {
        const store = createStore('TEST_STORE', {
            foo: 'bar',
        });

        expect(store.getFoo).toBeDefined();
        expect(store.setFoo).toBeDefined();
    });
});

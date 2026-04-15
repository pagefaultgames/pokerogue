export const mockLocalStorage = () => {
  let store = {} as Storage;

  return {
    getItem(key: string) {
      return store[key];
    },

    setItem(key: string, value: string) {
      store[key] = value;
    },

    hasOwnProperty(key: string) {
      return Object.hasOwn(store, key);
    },

    removeItem(key: string) {
      delete store[key];
    },

    clear() {
      store = {} as Storage;
    },
  };
};

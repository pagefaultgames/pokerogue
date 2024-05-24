export const setCookie = (name, value) => {
  document.cookie = `${name}=${value || ""};`;
};

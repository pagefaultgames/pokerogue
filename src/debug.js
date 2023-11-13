function getData() {
  const dataStr = localStorage.getItem('data');
  if (!dataStr)
    return null;
  return JSON.parse(atob(dataStr), (k, v) => k.endsWith('Attr') ? BigInt(v) : v);
}

function getSession() {
  const sessionStr = localStorage.getItem('sessionData');
  if (!sessionStr)
    return null;
  return JSON.parse(atob(sessionStr));
}
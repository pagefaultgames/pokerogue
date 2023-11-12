function getData() {
  const dataStr = localStorage.getItem('data');
  if (!dataStr)
    return null;
  return JSON.parse(atob(dataStr));
}

function getSession() {
  const sessionStr = localStorage.getItem('sessionData');
  if (!sessionStr)
    return null;
  return JSON.parse(atob(sessionStr));
}
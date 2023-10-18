function getSession() {
  const sessionStr = localStorage.getItem('sessionData');
  if (!sessionStr)
    return null;
  return JSON.parse(atob(sessionStr));
}
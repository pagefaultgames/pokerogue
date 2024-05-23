export function getData() {
  const dataStr = localStorage.getItem("data");
  if (!dataStr) {
    return null;
  }
  return JSON.parse(atob(dataStr), (k, v) => k.endsWith("Attr") && ![ "natureAttr", "abilityAttr", "passiveAttr" ].includes(k) ? BigInt(v) : v);
}

export function getSession() {
  const sessionStr = localStorage.getItem("sessionData");
  if (!sessionStr) {
    return null;
  }
  return JSON.parse(atob(sessionStr));
}

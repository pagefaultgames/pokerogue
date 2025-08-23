/**
 * Check if the given trainer class is female.
 * @param {Document} document - The HTML document to scrape
 * @returns {[gender: boolean, counterpartURLs: string[]]} A 2-length tuple containing:
 * 1. The trainer class' gender (female or not)
 * 2. A list of all the current class' opposite-gender counterparts (if the trainer has any).
 */
export function checkGenderAndType(document) {
  const infoBox = document.getElementsByClassName("infobox")[0];
  if (!infoBox) {
    return [false, []];
  }
  // Find the row of the table containing the specified gender
  const children = [...infoBox.getElementsByTagName("tr")];
  const genderCell = children.find(node => [...node.childNodes].some(c => c.textContent?.includes("Gender")));
  const tableBox = genderCell?.querySelector("td");
  if (!tableBox) {
    return [false, []];
  }

  const gender = getGender(tableBox);

  // CHeck the cell's inner HTML for any `href`s to gender counterparts and scrape them too
  const hrefExtractRegex = /href="\/wiki\/(.*?)_\(Trainer_class\)"/g;
  const counterpartCell = children.find(node => [...node.childNodes].some(c => c.textContent?.includes("Counterpart")));

  const counterpartURLs = [];
  for (const url of counterpartCell?.innerHTML?.matchAll(hrefExtractRegex) ?? []) {
    counterpartURLs.push(url[1]);
  }

  return [gender, counterpartURLs];
}

/**
 * Retrieve the gender from the given node text.
 * @param {HTMLTableCellElement} genderCell - The cell to check
 * @returns {boolean} The gender type
 * @todo Handle trainers whose gender type has changed across different gens (Artists, etc.)
 */
function getGender(genderCell) {
  const gender = genderCell.textContent?.trim().toLowerCase() ?? "";

  switch (gender) {
    case "female only":
      return true;
    case "male only":
    case "both":
    case undefined:
    default:
      return false;
  }
}

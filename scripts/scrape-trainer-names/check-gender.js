/**
 * Check if the given trainer class is female.
 * @param {Document} document - The HTML document to scrape
 * @returns {[gender: boolean, counterpartURL?: string]} A 2-length tuple containing:
 * 1. The trainer class' normal gender
 * 2. A URL to the gender counterpart of the current class (if the trainer has one).
 */
export function checkGenderAndType(document) {
  const infoBox = document.getElementById("infobox");
  if (!infoBox) {
    return [false];
  }
  // Find the row of the table containing the specified gender
  const children = [...infoBox.childNodes];
  const genderCell = children.find(
    node => node.nodeName === "tr" && [...node.childNodes].some(c => c.textContent?.includes("Gender")),
  )?.parentElement;
  if (!genderCell) {
    return [false];
  }

  const gender = getGender(genderCell.querySelector("tr"));
  const hrefExtractRegex = /href="\/wiki\/(.*)_(Trainer_class)"/g;
  const counterpartURL = genderCell.querySelector("td")?.getHTML().match(hrefExtractRegex)?.[1];

  return [gender, counterpartURL];
}

/**
 * Retrieve the gender from the given node text.
 * @param {HTMLTableRowElement?} genderCell - The cell to check
 * @returns {boolean} The gender type
 * @todo Handle trainers whose gender type has changed across different gens (Artists, etc.)
 */
function getGender(genderCell) {
  switch (genderCell?.textContent) {
    case "Female Only":
      return false;
    case "Male Only":
    case "Both":
    case undefined:
    default:
      return true;
  }
}

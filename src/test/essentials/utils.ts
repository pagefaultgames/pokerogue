// Function to convert Blob to string
export function blobToString(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Error reading Blob as string"));
    };

    reader.readAsText(blob);
  });
}

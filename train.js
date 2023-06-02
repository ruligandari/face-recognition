const trainFolder = "./labels"; // Ganti dengan path folder yang berisi folder-folder identitas orang dengan gambar-gambar wajah

async function fetchIdentityFolders(folderPath) {
  const response = await fetch(folderPath);
  const text = await response.text();
  const parser = new DOMParser();
  const html = parser.parseFromString(text, "text/html");
  const links = html.querySelectorAll("a");

  const identityFolders = [];
  Array.from(links).forEach((link) => {
    const folderName = link.href.split("/").slice(-2, -1)[0];
    if (!identityFolders.includes(folderName)) {
      identityFolders.push(folderName);
    }
  });

  return identityFolders;
}

async function fetchFolderContents(folderPath) {
  const response = await fetch(folderPath);
  const text = await response.text();
  const parser = new DOMParser();
  const html = parser.parseFromString(text, "text/html");
  const links = html.querySelectorAll("a");
  const fileNames = Array.from(links).map((link) => link.href);
  return fileNames;
}

async function trainModel() {
  const labeledFaceDescriptors = [];

  const identityFolders = await fetchIdentityFolders("labels");
  for (const folder of identityFolders) {
    const imageFiles = await fetchFolderContents(`labels/${folder}`);
    for (const imageFile of imageFiles) {
      const imagePath = `labels/${folder}/${imageFile}`;

      console.log(`Memuat ${imagePath}...`);

      // Memuat foto dan mendapatkan deskriptor wajah
      const img = await faceapi.fetchImage(imagePath);
      const fullFaceDescription = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (fullFaceDescription) {
        const faceDescriptor = fullFaceDescription.descriptor;
        labeledFaceDescriptors.push(
          new faceapi.LabeledFaceDescriptors(folder, [faceDescriptor])
        );
      }
    }
  }

  const modelData = JSON.stringify(labeledFaceDescriptors);

  // Menyimpan data model ke localStorage
  localStorage.setItem("faceModel", modelData);

  console.log("Pelatihan selesai. Model telah disimpan dalam format JSON.");
}

document.addEventListener("DOMContentLoaded", () => {
  const trainButton = document.getElementById("trainButton");
  trainButton.addEventListener("click", () => {
    trainModel();
  });
});

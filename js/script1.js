const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const labelInput = document.getElementById("label");
let capturedImage = null;
let faceMatcher;

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
])
  .then(() => {
    console.log("Models loaded successfully");
    return loadLabeledFaceDescriptors();
  })
  .then(() => {
    console.log("Face descriptors loaded successfully");
    startWebcam();
  })
  .catch((error) => {
    console.error("Error loading models:", error);
  });

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

async function captureImage() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedImage = canvas.toDataURL("image/jpeg");
  console.log("Image captured:", capturedImage);
}

async function runFaceRecognition() {
  if (capturedImage) {
    const img = await faceapi.fetchImage(capturedImage);
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    console.log("Detections:", detections);

    if (detections.length > 0) {
      const resizedDetections = faceapi.resizeResults(
        detections,
        video.getBoundingClientRect()
      );

      resizedDetections.forEach((detection) => {
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: "Face",
        });
        drawBox.draw(canvas);

        const descriptor = detection.descriptor;
        const bestMatch = faceMatcher.findBestMatch(descriptor);
        const label = bestMatch.label;

        labelInput.value = label;
        console.log("Recognized: ", label);
      });
    } else {
      labelInput.value = "Wajah tidak dikenali";
      console.log("No face detected");
    }
  } else {
    console.log("Please capture an image first.");
  }
}

const labels = ["Anggi", "Ruli"];

async function loadLabeledFaceDescriptors() {
  const labeledFaceDescriptors = await Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 1; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (!detections) {
          console.log(`No faces detected for ${label}`);
          continue;
        }
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
}

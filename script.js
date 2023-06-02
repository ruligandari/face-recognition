const video = document.getElementById("video");
const videoContainer = document.getElementById("videoContainer");
const overlay = document.getElementById("overlay");

async function loadModels() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]);
}

async function runFaceRecognition() {
  await loadModels();

  // Memulai pengenalan wajah secara real-time dari webcam
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;

      // Mendapatkan video feed dan mendeteksi wajah pada setiap frame
      video.addEventListener("play", () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(overlay, displaySize);

        setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          overlay
            .getContext("2d")
            .clearRect(0, 0, overlay.width, overlay.height);

          // Menampilkan kotak dan landmark pada wajah yang terdeteksi
          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );
          faceapi.draw.drawDetections(overlay, resizedDetections);
          faceapi.draw.drawFaceLandmarks(overlay, resizedDetections);
          faceapi.draw.drawFaceExpressions(overlay, resizedDetections);
        }, 100); // Mengatur kecepatan update pengenalan wajah (dalam milidetik)
      });
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error);
    });
}

// Menjalankan fungsi face recognition saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  runFaceRecognition();
});

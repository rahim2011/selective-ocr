const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const resultText = document.getElementById('resultText');
const progressBar = document.getElementById('progress');
const copyBtn = document.getElementById('copyBtn');

let img = new Image();
let startX, startY, endX, endY;
let isDrawing = false;
let scaleX = 1, scaleY = 1;

// Load image
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

img.onload = () => {
  const maxWidth = 600;
  const maxHeight = 400;
  
  // Calculate scaling ratio
  scaleX = img.width > maxWidth ? img.width / maxWidth : 1;
  scaleY = img.height > maxHeight ? img.height / maxHeight : 1;

  canvas.width = img.width / scaleX;
  canvas.height = img.height / scaleY;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

// Draw selection rectangle
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  isDrawing = true;
});

canvas.addEventListener('mousemove', e => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  endX = e.clientX - rect.left;
  endY = e.clientY - rect.top;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, endX-startX, endY-startY);
});

canvas.addEventListener('mouseup', e => {
  isDrawing = false;
  extractSelected();
});

// Extract selected area at original resolution
function extractSelected() {
  const sx = Math.min(startX, endX) * scaleX;
  const sy = Math.min(startY, endY) * scaleY;
  const sw = Math.abs(endX - startX) * scaleX;
  const sh = Math.abs(endY - startY) * scaleY;

  if(sw === 0 || sh === 0) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sw;
  tempCanvas.height = sh;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  tempCanvas.toBlob(blob => {
    resultText.value = "Processing...";
    progressBar.style.width = "0%";

    Tesseract.recognize(blob, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          progressBar.style.width = (m.progress*100).toFixed(0) + "%";
        }
      }
    }).then(({data:{text}}) => {
      resultText.value = text;
      progressBar.style.width = "100%";
    }).catch(err => {
      resultText.value = "Error: "+err;
      progressBar.style.width = "0%";
    });
  });
}

// Copy button
copyBtn.addEventListener('click', () => {
  resultText.select();
  document.execCommand('copy');
  alert("Text copied!");
});

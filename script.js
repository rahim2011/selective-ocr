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

/* =========================
   HELPER FOR MOUSE + TOUCH
========================= */
function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const touch = evt.touches ? evt.touches[0] : evt;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

/* =========================
   LOAD IMAGE
========================= */
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = evt => {
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

img.onload = () => {
  const maxWidth = 600;
  const maxHeight = 400;

  scaleX = img.width > maxWidth ? img.width / maxWidth : 1;
  scaleY = img.height > maxHeight ? img.height / maxHeight : 1;

  canvas.width = img.width / scaleX;
  canvas.height = img.height / scaleY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

/* =========================
   MOUSE EVENTS (PC)
========================= */
canvas.addEventListener('mousedown', e => {
  const pos = getPos(e);
  startX = pos.x;
  startY = pos.y;
  isDrawing = true;
});

canvas.addEventListener('mousemove', e => {
  if (!isDrawing) return;
  const pos = getPos(e);
  endX = pos.x;
  endY = pos.y;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, endX-startX, endY-startY);
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
  extractSelected();
});

/* =========================
   TOUCH EVENTS (MOBILE FIX)
========================= */
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const pos = getPos(e);
  startX = pos.x;
  startY = pos.y;
  isDrawing = true;
});

canvas.addEventListener('touchmove', e => {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  endX = pos.x;
  endY = pos.y;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, endX-startX, endY-startY);
});

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  isDrawing = false;
  extractSelected();
});

/* =========================
   SAFE OCR EXTRACTION
========================= */
function extractSelected() {
  if (
    startX == null || startY == null ||
    endX == null || endY == null
  ) return;

  const sx = Math.min(startX, endX) * scaleX;
  const sy = Math.min(startY, endY) * scaleY;
  const sw = Math.abs(endX - startX) * scaleX;
  const sh = Math.abs(endY - startY) * scaleY;

  if (sw < 5 || sh < 5) {
    resultText.value = "Selection too small";
    return;
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sw;
  tempCanvas.height = sh;

  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  tempCanvas.toBlob(blob => {
    if (!blob) {
      resultText.value = "Failed to read image on mobile";
      return;
    }

    resultText.value = "Processing...";
    progressBar.style.width = "0%";

    Tesseract.recognize(blob, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          progressBar.style.width = Math.round(m.progress * 100) + "%";
        }
      }
    }).then(({ data: { text } }) => {
      resultText.value = text;
      progressBar.style.width = "100%";
    }).catch(err => {
      resultText.value = "OCR error";
      progressBar.style.width = "0%";
      console.error(err);
    });
  });
}

/* =========================
   COPY BUTTON
========================= */
copyBtn.addEventListener('click', () => {
  resultText.select();
  document.execCommand('copy');
  alert("Text copied!");
});

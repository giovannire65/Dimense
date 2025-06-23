const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let textureImg = new Image();
let heightImg = new Image();
let textureLoaded = false;
let heightLoaded = false;

let lightDir = { x: 0, y: 0, z: 1 };

document.getElementById("textureInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      textureImg.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("heightInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      heightImg.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

textureImg.onload = () => {
  textureLoaded = true;
  tryRender();
};

heightImg.onload = () => {
  heightLoaded = true;
  tryRender();
};

function tryRender() {
  if (textureLoaded && heightLoaded) {
    canvas.width = textureImg.width;
    canvas.height = textureImg.height;
    draw();
  }
}

function getHeightMapNormals(heightData, width, height) {
  const normals = new Array(width * height * 3);
  const scale = 0.5;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      const hL = heightData[((y) * width + (x - 1)) * 4];
      const hR = heightData[((y) * width + (x + 1)) * 4];
      const hU = heightData[((y - 1) * width + x) * 4];
      const hD = heightData[((y + 1) * width + x) * 4];

      const dx = (hR - hL) * scale / 255;
      const dy = (hD - hU) * scale / 255;
      const dz = 1;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = dx / len;
      const ny = dy / len;
      const nz = dz / len;

      const nIdx = (y * width + x) * 3;
      normals[nIdx] = nx;
      normals[nIdx + 1] = ny;
      normals[nIdx + 2] = nz;
    }
  }
  return normals;
}

function draw() {
  ctx.drawImage(textureImg, 0, 0);
  const textureData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const texturePixels = textureData.data;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(heightImg, 0, 0);
  const heightData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;

  const normals = getHeightMapNormals(heightData, canvas.width, canvas.height);

  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4;
      const nIdx = (y * canvas.width + x) * 3;

      const nx = normals[nIdx];
      const ny = normals[nIdx + 1];
      const nz = normals[nIdx + 2];

      let dot = nx * lightDir.x + ny * lightDir.y + nz * lightDir.z;
      dot = Math.max(0, dot);

      texturePixels[idx] *= dot;
      texturePixels[idx + 1] *= dot;
      texturePixels[idx + 2] *= dot;
    }
  }

  ctx.putImageData(textureData, 0, 0);
}

window.addEventListener("deviceorientation", (e) => {
  let beta = e.beta || 0;
  let gamma = e.gamma || 0;

  lightDir.x = gamma / 90;
  lightDir.y = beta / 90;
  lightDir.z = 1;
  if (textureLoaded && heightLoaded) draw();
});

function loadExample(name) {
  textureImg.src = 'examples/' + name + '_texture.jpg';
  heightImg.src = 'examples/' + name + '_height.png';
}
let capture;
const bitLength = 5;
const codeLength = 12;
const ysq = (bitLength * 2) + 1;
const xsq = (codeLength * 2) + 1;
const xunit = 15;
const yunit = 15;
const cW = xsq * xunit;
const cH = ysq * yunit;
const code = [];
const charList = [" ","a","b","c","d","e","f","g","h","i","j","k","l","m","n","ñ","o","p","q","r","s","t","u","v","w","x","y","z","!","¡"];

let vertices;
let captureBtn;
let msg;
let g;

const holeThresh = 220;

const captureOptions= {
  audio: false,
  video: {
    facingMode: "environment"
  }
};

function setup() {
  createCanvas(cW, cH).id("canvas").parent("canvas-container-1");
  background(0);
  frameRate(4);

  capture = createCapture(captureOptions).hide();

  msg = createP("-> ").class("message").parent("message-container");
  g = createGraphics(cW, cH).id("graphic");

  captureBtn = createButton("LEER TARJETA").parent("message-container").mouseClicked(scanCard);

  charSheet();
}

function draw() {
  g.image(capture, 0, 0, width, 0);
  readBorder();
}

function readBorder() {
  const src = cv.imread('graphic');
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.Canny(src, src, 50, 100, 3, false);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_TC89_KCOS);

  let maxArea = 0;
  let maxCnt;
  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if (area > maxArea) {
      maxArea = area;
      maxCnt= cnt;
    }
  }

  if (maxCnt != undefined) {
    let rotatedRect = cv.minAreaRect(maxCnt);
    vertices = cv.RotatedRect.points(rotatedRect);

    g.noFill();
    g.stroke(255, 0, 0);
    g.strokeWeight(4);
    g.beginShape();
    for (let v of vertices) {
      g.vertex(v.x, v.y);
    }
    g.endShape(CLOSE);
  }

  const resized = new cv.Mat();
  const dsize = new cv.Size(cW, cH);
  cv.resize(cv.imread('graphic'), resized, dsize, 0, 0, cv.INTER_AREA);
  cv.imshow('canvas2', resized); // SHOW CAMERA IMAGE

  src.delete(); contours.delete(); hierarchy.delete(); resized.delete();
}

function scanCard() {
  if (vertices == undefined) return

  const srcP = cv.imread('graphic'); // IMAGE TO SHOW ON CANVAS
  cv.cvtColor(srcP, srcP, cv.COLOR_RGBA2GRAY, 0);
  cv.adaptiveThreshold(srcP, srcP, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 7, 2);
  let dsize = new cv.Size(cW, cH);

  // SELECT CORRECT ORDER OF VERTICES
  let mapped = Object.values(vertices).map(v => [v.x, v.y]);
  let vFlattened = [];
  const summed = mapped.map(v => v[0] + v[1]);
  const diff = mapped.map(v => v[0] - v[1]);
  vFlattened[0] = mapped[argMin(summed)]; // TOP-LEFT
  vFlattened[1] = mapped[argMax(diff)]; // TOP-RIGHT
  vFlattened[2] = mapped[argMin(diff)]; // BOTTOM-LEFT
  vFlattened[3] = mapped[argMax(summed)]; // BOTTOM-RIGHT    
  vFlattened = vFlattened.flat();

  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, vFlattened);
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, cW, 0, 0, cH, cW, cH]);
  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  let dst = new cv.Mat();
  cv.warpPerspective(srcP, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

  // DISPLAY
  cv.imshow('canvas', dst); // SHOW SCANNED IMAGE

  srcP.delete(); dst.delete();

  // GET PIXELS SAMPLE
  let signal = [];
  loadPixels();
  for (let y = 0; y < ysq; y++) {
    signal[y] = [];
    for (let x = 0; x < xsq; x++) {
      if (y % 2 === 1 && x % 2 === 1) {
        let sum = 0;
        for (let y1 = -5; y1 <= 5; y1++) {
          for (let x1 = -5; x1 <= 5; x1++) {
            const p = get((x * xunit) + (xunit / 2) + x1, (y * yunit) + (yunit / 2) + y1);
            sum += p[0];
          }
        }
        signal[y][x] = sum / 100;
      }
    }
  }
  updatePixels();

  // DISPLAY GRID
  for (let y = 0; y < ysq; y++) {
    stroke(0);
    line(0, y * yunit, width, y * yunit);
    for (let x = 0; x < xsq; x++) {
      stroke(0);
      line(x * xunit, 0, x * xunit, height );
      if (y % 2 === 1 && x % 2 === 1) {
        noFill();
        if (signal[y][x] > holeThresh) {
          stroke(255, 0, 0);
        } else {
          stroke(0, 255, 0);
        }
        ellipse((x * xunit) + (xunit / 2), (y * yunit) + (yunit / 2), xunit, yunit);
      }
    }
  }

  const code = getCode(signal);
  const decoded = decode(code);
  msg.html("-> " + decoded);
}

function decode(code) {
  let message = "";
  for (let line of code) {
    const binary = line.reduce((a,c)=>a+c, "");
    const decimal = parseInt(binary, 2);
    if (decimal < charList.length) {
      message += charList[decimal];
    } else {
      message += " ";
    }
  }
  return message
}

function charSheet() {
  const sheet = [];
  createP(`TABLA DE CÓDIGOS\n`).parent("code-table-container");
  createP(`# --- binario --- caracter`).parent("code-table-container");
  for (let i = 0; i < charList.length; i++) {
    sheet[i] = [i, i.toString(2).padStart(bitLength, "0"), charList[i]];
    createP(`${i} --- ${i.toString(2).padStart(bitLength, "0")} --- ${charList[i]}`).parent("code-table-container");
  }
}

function argMax(array) {
  return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function argMin(array) {
  return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
}

function transpose(matrix) {
  return matrix[0].map((col, c) => matrix.map((row, r) => matrix[r][c]));
}

function getCode(signal) {
  let code = [];
  let count = 0;
  for (let i in signal) {
    if (signal[i].length > 0) {
      code[count] = [];
      for (let bit of signal[i]) {
        if (bit != undefined) {
          code[count].push(bit > holeThresh ? 0 : 1);
        }
      }
      count++;
    }
  }
  return transpose(code);
}
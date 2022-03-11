let capture;
const bitLength = 5;
const codeLength = 12;
const xsq = (codeLength * 2) + 1;
const ysq = (bitLength * 2) + 1;
const xunit = 20;
const yunit = 20;
const cW = xsq * xunit;
const cH = ysq * yunit;
let code = resetCode();
const charList = [" ","a","b","c","d","e","f","g","h","i","j","k","l","m","n","ñ","o","p","q","r","s","t","u","v","w","x","y","z","!","¡"];

let cnv;
let captureBtn;
let msg;

function setup() {
  cnv = createCanvas(cW, cH).id("canvas").parent("canvas-container");
  background(255);
  cursor(HAND);
  frameRate(12);

  msg = createP("-> ").class("message").parent("message-container");

  charSheet();

  cnv.mouseClicked((e)=>{
    let x = floor(e.offsetX / xunit);
    let y = floor(e.offsetY / yunit);
    if (x % 2 === 1 && y % 2 === 1) {
      x = floor(x / 2);
      y = floor(y / 2);
      changeBit(y, x);
      drawCard();
      const m = decode(code);
      msg.html(`-> ${m}`);
    }
  });
  
  drawCard();
}

function drawCard() {
  background(255);
  let countY = 0;
  for (let y = 0; y < ysq; y++) {
    const py = y * yunit;
    let countX = 0;
    for (let x = 0; x < xsq; x++) {
      if (y % 2 === 1 && x % 2 === 1) {
        const px = x * xunit;
        stroke(0);
        fill(code[countY][countX] === 0 ? 255 : 0);
        rect(px, py, xunit, yunit);
      }
      if (x % 2 === 1) countX++;
    }
    if (y % 2 === 1) countY++;
  }

  fill(150);
  noStroke();
  for (let y = 1; y < ysq; y += 2) {
    text(floor(y/2), xunit / 3, (1 + y) * yunit);
  }
  
  for (let x = 1; x < xsq; x += 2) {
    
    text(floor(x/2) + 1, x * xunit, yunit - 5);
    const xpos = (xunit/2) + (1 + x) * xunit;
    stroke(220);
    line(xpos, yunit, xpos, height - yunit);
  }
}

function changeBit(y, x) {
  code[y][x] = code[y][x] === 0 ? 1 : 0;
}

function decode(code) {
  const tcode = transpose(code);
  let message = "";
  for (let line of tcode) {
    const binary = line.reduce((a,c)=>a+c, "");
    const decimal = parseInt(binary, 2);
    if (decimal < charList.length) {
      message += charList[decimal];
    } else {
      message += "-";
    }
  }
  return message
}

function transpose(matrix) {
  return matrix[0].map((col, c) => matrix.map((row, r) => matrix[r][c]));
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

function resetCode() {
  const code = [];
  for (let y = 0; y < bitLength; y++) {
    code[y] = [];
    for (let x = 0; x < codeLength; x++) {
      code[y][x] = 0
    }
  }
  return code
}
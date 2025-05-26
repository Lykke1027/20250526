let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let gesture = '';

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
    gesture = detectGesture(handPredictions);
  });
}

function modelReady() {
  // 臉部模型載入完成
}

function handModelReady() {
  // 手部模型載入完成
}

// 手勢偵測（簡易版：石頭=全握拳，剪刀=只伸食指中指，布=全張開）
function detectGesture(hands) {
  if (hands.length === 0) return '';
  const annotations = hands[0].annotations;
  // 取得五指末端座標
  const tips = [
    annotations.thumb[3],
    annotations.indexFinger[3],
    annotations.middleFinger[3],
    annotations.ringFinger[3],
    annotations.pinky[3]
  ];
  // 取得五指根部座標
  const bases = [
    annotations.thumb[0],
    annotations.indexFinger[0],
    annotations.middleFinger[0],
    annotations.ringFinger[0],
    annotations.pinky[0]
  ];
  // 判斷每根手指是否伸直（末端與根部距離大於某閾值）
  let dists = tips.map((tip, i) => dist(tip[0], tip[1], bases[i][0], bases[i][1]));
  let extended = dists.map(d => d > 45);
  let curled = dists.map(d => d < 35);

  // 石頭：五指都彎曲
  if (curled.every(c => c)) return 'rock';
  // 剪刀：食指和中指伸直，其餘三指不用太嚴格
  if (extended[1] && extended[2] && !extended[0] && (!extended[3] || !extended[4])) return 'scissors';
  // 布：五指都伸直
  if (extended.every(e => e)) return 'paper';
  return '';
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 額頭(第94點)、左眼(33)、右眼(263)、鼻子(1)
    const [fx, fy] = keypoints[94];
    const [lx, ly] = keypoints[33];
    const [rx, ry] = keypoints[263];
    const [nx, ny] = keypoints[1];

    if (gesture === 'rock') {
      // 額頭畫圓
      noFill();
      stroke(255, 0, 0);
      strokeWeight(4);
      ellipse(fx, fy, 100, 100);
    } else if (gesture === 'scissors') {
      // 鼻子畫三角形
      drawTriangle(nx, ny, 40);
    } else if (gesture === 'paper') {
      // 右眼畫星星
      drawStar(rx, ry, 20, 40, 5);
    }
  }
}

// 畫星星函式
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  fill(255, 255, 0);
  stroke(255, 204, 0);
  strokeWeight(3);
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 畫三角形函式
function drawTriangle(x, y, size) {
  fill(0, 255, 255);
  stroke(0, 150, 255);
  strokeWeight(4);
  let h = size * Math.sqrt(3) / 2;
  beginShape();
  vertex(x, y - h / 2);
  vertex(x - size / 2, y + h / 2);
  vertex(x + size / 2, y + h / 2);
  endShape(CLOSE);
}

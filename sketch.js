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
  let extended = tips.map((tip, i) => dist(tip[0], tip[1], bases[i][0], bases[i][1]) > 40);

  // 石頭：大部分手指沒伸直即可（允許一根手指微微伸直）
  if (extended.filter(e => e).length <= 1) return 'rock';
  // 剪刀：食指與中指伸直，其餘收起（允許有一根小指或無名指微微伸直）
  if (
    extended[1] && extended[2] && // 食指、中指伸直
    !extended[0] && // 拇指收起
    extended.slice(3).filter(e => e).length <= 1 // 無名指、小指最多一根伸直
  ) return 'scissors';
  // 布：全部伸直
  if (extended.every(e => e)) return 'paper';
  return '';
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 額頭(第94點)、左眼(33)、右眼(263)
    const [fx, fy] = keypoints[94];
    const [lx, ly] = keypoints[33];
    const [rx, ry] = keypoints[263];

    if (gesture === 'rock') {
      // 額頭畫圓
      noFill();
      stroke(255, 0, 0);
      strokeWeight(4);
      ellipse(fx, fy, 100, 100);
    } else if (gesture === 'scissors') {
      // 左眼畫星星
      drawStar(lx, ly, 20, 40, 5);
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

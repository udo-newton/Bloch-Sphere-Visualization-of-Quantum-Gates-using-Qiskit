const canvas = document.getElementById("blochCanvas");
const ctx = canvas.getContext("2d");
const ketLabel = document.getElementById("ketLabel");
const gateResult = document.getElementById("gateResult");
const vectorReadout = document.getElementById("vectorReadout");
const stateReadout = document.getElementById("stateReadout");
const phaseAngle = document.getElementById("phaseAngle");
const phaseAngleLabel = document.getElementById("phaseAngleLabel");
const decreaseAngle = document.getElementById("decreaseAngle");
const increaseAngle = document.getElementById("increaseAngle");
const resetState = document.getElementById("resetState");

let state = [
  { re: 1, im: 0 },
  { re: 0, im: 0 }
];

const gates = {
  x: {
    name: "Pauli-X",
    matrix: [
      [{ re: 0, im: 0 }, { re: 1, im: 0 }],
      [{ re: 1, im: 0 }, { re: 0, im: 0 }]
    ],
    message: "Pauli-X flips the qubit between the north pole |0> and south pole |1>."
  },
  h: {
    name: "Hadamard",
    matrix: [
      [{ re: Math.SQRT1_2, im: 0 }, { re: Math.SQRT1_2, im: 0 }],
      [{ re: Math.SQRT1_2, im: 0 }, { re: -Math.SQRT1_2, im: 0 }]
    ],
    message: "Hadamard creates or removes equal superposition, moving the vector between Z and X directions."
  },
  z: {
    name: "Pauli-Z",
    matrix: [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: -1, im: 0 }]
    ],
    message: "Pauli-Z changes the sign of the |1> amplitude, rotating the vector around the vertical Z axis."
  },
  i: {
    name: "Identity",
    matrix: [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: 1, im: 0 }]
    ],
    message: "Identity is the no-change gate. The state and Bloch vector stay where they are."
  }
};

function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

function mul(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

function conj(a) {
  return { re: a.re, im: -a.im };
}

function abs2(a) {
  return a.re * a.re + a.im * a.im;
}

function applyMatrix(matrix) {
  const next = [
    add(mul(matrix[0][0], state[0]), mul(matrix[0][1], state[1])),
    add(mul(matrix[1][0], state[0]), mul(matrix[1][1], state[1]))
  ];
  state = normalize(next);
}

function normalize(pair) {
  const norm = Math.sqrt(abs2(pair[0]) + abs2(pair[1])) || 1;
  return pair.map((value) => ({ re: value.re / norm, im: value.im / norm }));
}

function blochVector() {
  const alpha = state[0];
  const beta = state[1];
  const alphaConjBeta = mul(conj(alpha), beta);
  return {
    x: 2 * alphaConjBeta.re,
    y: 2 * alphaConjBeta.im,
    z: abs2(alpha) - abs2(beta)
  };
}

function formatNumber(value) {
  const cleaned = Math.abs(value) < 0.00001 ? 0 : value;
  return cleaned.toFixed(2);
}

function formatComplex(value) {
  const re = Math.abs(value.re) < 0.00001 ? 0 : value.re;
  const im = Math.abs(value.im) < 0.00001 ? 0 : value.im;
  if (im === 0) return formatNumber(re);
  if (re === 0) return `${formatNumber(im)}i`;
  return `${formatNumber(re)} ${im >= 0 ? "+" : "-"} ${formatNumber(Math.abs(im))}i`;
}

function describeKet() {
  const [a, b] = state;
  if (Math.abs(a.re - 1) < 0.00001 && Math.abs(a.im) < 0.00001 && abs2(b) < 0.00001) return "|0>";
  if (Math.abs(b.re - 1) < 0.00001 && Math.abs(b.im) < 0.00001 && abs2(a) < 0.00001) return "|1>";
  return `${formatComplex(a)}|0> + ${formatComplex(b)}|1>`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  draw();
}

function project(point, centerX, centerY, radius) {
  return {
    x: centerX + point.y * radius - point.x * radius * 0.58,
    y: centerY - point.z * radius + point.y * radius * 0.12 + point.x * radius * 0.48
  };
}

function drawEllipse(centerX, centerY, radius, rotation, color) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawArrow(from, to, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 14;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 7), to.y - size * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 7), to.y - size * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

function drawLabel(text, point, centerX, centerY, radius) {
  const p = project(point, centerX, centerY, radius);
  ctx.fillStyle = "rgba(247, 240, 255, 0.9)";
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, p.x, p.y);
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 12;
  const radius = Math.min(width, height) * 0.34;
  const gradient = ctx.createRadialGradient(centerX - radius * 0.4, centerY - radius * 0.55, radius * 0.1, centerX, centerY, radius);
  gradient.addColorStop(0, "rgba(201, 167, 255, 0.32)");
  gradient.addColorStop(0.62, "rgba(143, 69, 255, 0.08)");
  gradient.addColorStop(1, "rgba(143, 69, 255, 0.02)");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(201, 167, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawEllipse(centerX, centerY, radius, 0, "rgba(201, 167, 255, 0.32)");
  drawEllipse(centerX, centerY, radius, Math.PI / 2, "rgba(201, 167, 255, 0.18)");
  drawEllipse(centerX, centerY, radius, -0.42, "rgba(255, 79, 216, 0.28)");

  const axisColor = "rgba(247, 240, 255, 0.38)";
  drawArrow(project({ x: -1.1, y: 0, z: 0 }, centerX, centerY, radius), project({ x: 1.1, y: 0, z: 0 }, centerX, centerY, radius), axisColor);
  drawArrow(project({ x: 0, y: -1.1, z: 0 }, centerX, centerY, radius), project({ x: 0, y: 1.1, z: 0 }, centerX, centerY, radius), axisColor);
  drawArrow(project({ x: 0, y: 0, z: -1.1 }, centerX, centerY, radius), project({ x: 0, y: 0, z: 1.1 }, centerX, centerY, radius), axisColor);

  drawLabel("+X", { x: 1.23, y: 0, z: 0 }, centerX, centerY, radius);
  drawLabel("+Y", { x: 0, y: 1.28, z: 0 }, centerX, centerY, radius);
  drawLabel("|0>", { x: 0, y: 0, z: 1.25 }, centerX, centerY, radius);
  drawLabel("|1>", { x: 0, y: 0, z: -1.25 }, centerX, centerY, radius);

  const vector = blochVector();
  const origin = project({ x: 0, y: 0, z: 0 }, centerX, centerY, radius);
  const tip = project(vector, centerX, centerY, radius * 0.96);
  drawArrow(origin, tip, "#ff4fd8");

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function updateReadout(message) {
  const vector = blochVector();
  ketLabel.textContent = describeKet();
  gateResult.textContent = message;
  vectorReadout.textContent = `(${formatNumber(vector.x)}, ${formatNumber(vector.y)}, ${formatNumber(vector.z)})`;
  stateReadout.textContent = `[${formatComplex(state[0])}, ${formatComplex(state[1])}]`;
  draw();
}

function setPhaseAngle(value) {
  const min = Number(phaseAngle.min);
  const max = Number(phaseAngle.max);
  const next = Math.min(max, Math.max(min, value));
  phaseAngle.value = String(next);
  phaseAngleLabel.textContent = `${phaseAngle.value} deg`;
}

function phaseMatrix() {
  const radians = Number(phaseAngle.value) * Math.PI / 180;
  return [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: Math.cos(radians), im: Math.sin(radians) }]
  ];
}

document.querySelectorAll(".gate-button").forEach((button) => {
  button.addEventListener("click", () => {
    const gate = button.dataset.gate;
    if (gate === "p") {
      applyMatrix(phaseMatrix());
      updateReadout(`Applied P phase gate with a ${phaseAngle.value} degree angle. The |1> amplitude gained that phase.`);
      return;
    }

    applyMatrix(gates[gate].matrix);
    updateReadout(`Applied ${gates[gate].name}. ${gates[gate].message}`);
  });
});

phaseAngle.addEventListener("input", () => {
  setPhaseAngle(Number(phaseAngle.value));
});

decreaseAngle.addEventListener("click", () => {
  setPhaseAngle(Number(phaseAngle.value) - Number(phaseAngle.step));
});

increaseAngle.addEventListener("click", () => {
  setPhaseAngle(Number(phaseAngle.value) + Number(phaseAngle.step));
});

resetState.addEventListener("click", () => {
  state = [
    { re: 1, im: 0 },
    { re: 0, im: 0 }
  ];
  setPhaseAngle(90);
  updateReadout("Reset complete. The qubit is back at |0>, pointing to the north pole.");
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updateReadout("Ready at the default |0> state. The vector points to the north pole.");

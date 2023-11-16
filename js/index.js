class State {
  constructor() {
    this._state = {
      uploads: [],
      currentIdx: -1,
      currentImg: null,
      canRedraw: true,
    };
    this._events = {};
  }

  set(key, value) {
    this._state[key] = value;
  }

  get(key, dflt) {
    if (!this._state.hasOwnProperty(key)) {
      return dflt;
    }

    return this._state[key];
  }

  publish(evt, data) {
    if (!this._events[evt]) return;
    this._events[evt].forEach(subscriber => subscriber(data));
  }

  subscribe(evt, subscriber) {
    if (!this._events[evt]) {
      this._events[evt] = [];
    }

    this._events[evt].push(subscriber);
  }
}


const ELEMENTS = {};
const STATE = new State();


class Upload {
  constructor(file) {
    this.file = file;
    this.img = null;
    this.zoom = 1;
  }

  update(attrs) {
    Object.keys(attrs).forEach(attr => {
      this[attr] = attrs[attr];
    });
  }
}

function save(idx) {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 300;
  exportCanvas.height = 300;
  exportCanvas.style.visibility = 'hidden';
  document.body.appendChild(exportCanvas);
  const expCtx = exportCanvas.getContext('2d');

  const canvas1 = getElement('#canvas1');
  const canvas2 = getElement('#canvas2');
  expCtx.drawImage(canvas1, 0, 0);
  expCtx.drawImage(canvas2, 0, 0);

  const dataUrl = exportCanvas.toDataURL("image/png");
  const link = document.createElement('a');
  const upload = getUpload(idx);
  link.download = 'export_' + upload.file.name + '.png';
  link.href = dataUrl.replace("image/png", "image/octet-stream")
  link.click();

  exportCanvas.remove();
}

function getElement(selector) {
  if (ELEMENTS[selector]) {
    return ELEMENTS[selector];
  }

  const element = document.querySelector(selector);
  ELEMENTS[selector] = element;
  return element;
}

function removeElement(selector) {
  if (ELEMENTS[selector]) {
    delete ELEMENTS[selector];
  }

  const element = document.querySelector(selector);
  if (element) {
    element.remove();;
  }
}

function uploadFile(idx) {
  const uploads = STATE.get('uploads');

  STATE.set('currentIdx', idx);
  const img = new Image();
  img.onload = function () {
    uploads[idx].img = img;
    STATE.publish('upload');
  }
  img.src = URL.createObjectURL(getCurrentUpload().file);
}

function uploadFiles(evt) {
  const fileUpload = getElement('#file-input');
  let uploads = [].map.call(fileUpload.files, (file) => new Upload(file));
  STATE.set('uploads', uploads);
  if (fileUpload.files.length) {
    uploadFile(0);
  }
}

function getUpload(idx) {
  return STATE.get('uploads')[idx];
}

function getCurrentUpload() {
  return STATE.get('uploads')[STATE.get('currentIdx')];
}

function displayCurrent(curX, curY) {
  const currentUpload = getCurrentUpload();
  const currentImg = currentUpload && currentUpload.img;
  if (!currentImg) return;

  removeElement('#canvas-pattern');
  const canvasPattern = document.createElement('canvas');
  canvasPattern.id = 'canvas-pattern';
  getElement('#canvases').appendChild(canvasPattern);

  const ctxP = canvasPattern.getContext('2d');

  // scale pattern canvas
  canvasPattern.width = currentImg.width * currentUpload.zoom;
  canvasPattern.height = currentImg.height * currentUpload.zoom;

  const dx = currentUpload.dx || 0;
  const dy = currentUpload.dy || 0;
  ctxP.drawImage(currentImg, dx, dy, canvasPattern.width, canvasPattern.height);
  const pattern = ctxP.createPattern(canvasPattern, "no-repeat");

  const canvas = getElement('#canvas2');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.fillStyle = pattern;
  ctx.arc(150, 150, 145, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}

function onZoomChange(evt) {
  const input = getElement('#zoom-level');
  getCurrentUpload().update({zoom: input.value})
  displayCurrent();
}

function getDx(curX) {
  if (typeof(curX) !== 'number') return 0;
  return curX - STATE.get('startX');
}

function getDy(curY) {
  if (typeof(curY) !== 'number') return 0;
  return curY - STATE.get('startY');
}

function onMouseDown(evt) {
  console.log('mouse down:', evt.clientX, evt.clientY);
  STATE.set('moving', true);
  STATE.set('startX', evt.clientX);
  STATE.set('startY', evt.clientY);
}

function onMouseMove(evt) {
  if (!STATE.get('canRedraw') || !STATE.get('moving')) return;

  const dx = getDx(evt.clientX);
  const dy = getDy(evt.clientY);
  const current = getCurrentUpload();
  current.update({dx, dy});
  displayCurrent();

  STATE.set('canRedraw', false);
  requestAnimationFrame(function () {
    STATE.set('canRedraw', true);
  });
}

function onMouseUp(evt) {
  console.log('mouse up:', evt.clientX, evt.clientY);
  STATE.set('moving', false);
}

function setupMouseListeners() {
  const canvas = getElement('#canvas2');
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
}

function getImageChanger(n) {
  return function (evt) {
    const currentIdx = STATE.get('currentIdx');
    const maxIdx = STATE.get('uploads').length - 1;
    const nextIdx = currentIdx + n;
    if (nextIdx < 0 || nextIdx > maxIdx) {
      return;
    }

    const nextUpload = getUpload(nextIdx);
    if (nextUpload.img) {
      STATE.set('currentIdx', nextIdx);
      displayCurrent();
    } else {
      uploadFile(nextIdx);
    }
  }
}

function setupButtons() {
  getElement('#next-img').addEventListener('click', getImageChanger(1));
  getElement('#prev-img').addEventListener('click', getImageChanger(-1));
}

function exportFiles() {
  const uploads = STATE.get('uploads');
  for (let i = 0; i < uploads.length; i++) {
    STATE.set('currentIdx', i);
    displayCurrent();
    save(i);
  }
}

function setup() {
  getElement('#zoom-level').addEventListener('input', onZoomChange);
  setupMouseListeners();
  setupButtons();
  STATE.subscribe('upload', displayCurrent);
  const submitFiles = getElement('#submit-files');
  submitFiles.addEventListener('click', uploadFiles);
  getElement('#export').addEventListener('click', exportFiles);

  const circleCanvas = getElement('#canvas1');
  const ccCtx = circleCanvas.getContext('2d');
  ccCtx.beginPath();
  ccCtx.arc(150, 150, 149, 0, 2 * Math.PI);
  ccCtx.fillStyle = "#c9c43b"
  ccCtx.fill();
  ccCtx.closePath();

  ccCtx.beginPath();
  ccCtx.arc(150, 150, 145, 0, 2 * Math.PI);
  ccCtx.fillStyle = "black";
  ccCtx.fill();
  ccCtx.closePath();
}

document.addEventListener('DOMContentLoaded', setup);

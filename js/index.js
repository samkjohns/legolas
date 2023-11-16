class State {
  constructor() {
    this._state = {
      uploads: [],
      currentIdx: -1,
      currentImg: null,
      zoom: 1,
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
    console.log(this.file);
  }
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


function uploadFiles(evt) {
  const fileUpload = getElement('#file-input');
  let uploads = [].map.call(fileUpload.files, (file) => new Upload(file));
  STATE.set('uploads', uploads);
  if (fileUpload.files.length) {
    STATE.set('currentIdx', 0);
    const img = new Image();
    img.onload = function () {
      STATE.set('currentImg', img);
      STATE.publish('upload');
    }
    img.src = URL.createObjectURL(getCurrentUpload().file);
  }
}

function getCurrentUpload() {
  return STATE.get('uploads')[STATE.get('currentIdx')];
}

function displayCurrent(curX, curY) {
  const currentImg = STATE.get('currentImg');
  if (!currentImg) return;

  removeElement('#canvas-pattern');
  const canvasPattern = document.createElement('canvas');
  canvasPattern.id = 'canvas-pattern';
  getElement('#canvases').appendChild(canvasPattern);

  const ctxP = canvasPattern.getContext('2d');

  // scale pattern canvas
  canvasPattern.width = currentImg.width * STATE.get('zoom');
  canvasPattern.height = currentImg.height * STATE.get('zoom');

  const dx = getDx(curX);
  const dy = getDy(curY);
  ctxP.drawImage(currentImg, dx, dy, canvasPattern.width, canvasPattern.height);
  const pattern = ctxP.createPattern(canvasPattern, "no-repeat");

  const canvas = getElement('#canvas2');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = pattern;
  ctx.arc(150, 150, 145, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}

function onZoomChange(evt) {
  const input = getElement('#zoom-level');
  STATE.set('zoom', input.value);
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
  console.log('mouse move:', evt.clientX, evt.clientY);
  displayCurrent(evt.clientX, evt.clientY);

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

function setup() {
  getElement('#zoom-level').addEventListener('change', onZoomChange);
  setupMouseListeners();
  STATE.subscribe('upload', displayCurrent);
  const submitFiles = getElement('#submit-files');
  submitFiles.addEventListener('click', uploadFiles);

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
  //ccCtx.stroke();
}

document.addEventListener('DOMContentLoaded', setup);

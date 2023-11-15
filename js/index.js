class State {
  constructor() {
    this._state = {
      uploads: [],
      currentIdx: -1,
      currentImg: null
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

function displayCurrent() {
  const canvas = getElement('#canvas2');
  const ctx = canvas.getContext('2d');

  const currentImg = STATE.get('currentImg');
  ctx.drawImage(currentImg, 0, 0);
}

function setup() {
  STATE.subscribe('upload', displayCurrent);
  const submitFiles = getElement('#submit-files');
  submitFiles.addEventListener('click', uploadFiles);

  const circleCanvas = getElement('#canvas1');
  const ccCtx = circleCanvas.getContext('2d');
  ccCtx.beginPath();
  ccCtx.arc(51, 51, 50, 0, 2 * Math.PI);
  ccCtx.stroke();
}

document.addEventListener('DOMContentLoaded', setup);

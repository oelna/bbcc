import Color from './color.min.js';

var studiorichter = {
	'bbcc': {
		'version': 1,
		'videoLogo': false
	}
};

console.log('init');

// forEach polyfill for IE (sigh)
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function forEach (callback, thisArg) {
		if (typeof callback !== 'function') {
			throw new TypeError(callback + ' is not a function');
		}
		var array = this;
		thisArg = thisArg || this;
		for (var i = 0, l = array.length; i !== l; ++i) {
			callback.call(thisArg, array[i], i, array);
		}
	};
}
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}

// logo video / canvas
function update () {
	// get a block size (see demo for this approach)
	const size = 6 / 100;
	const w = canvas.width * size;
	const h = canvas.height * size;

	// draw the original image at a fraction of the final size
	ctx.drawImage(video, 0, 0, w, h);

	// turn off image aliasing
	ctx.msImageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
	ctx.imageSmoothingEnabled = false;

	// enlarge the minimized image to full size
	ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width+20, canvas.height+20);

	if (video.paused) {
		console.warn('had to restart video play');
		video.play();
	}
	// console.log('frame', video.paused);

	requestAnimationFrame(update);
}

const canvas = document.querySelector('.logo-bg canvas');
const ctx = canvas.getContext('2d');

let videoInitialized = false;
const video = document.querySelector('video.logo-bg-source');

if (studiorichter.bbcc.videoLogo) {
	console.log('logo video background enabled');
	video.setAttribute('src', './video_160.mp4');
}

video.addEventListener('canplaythrough', function (e) {
	console.log('video init');
	this.style.objectFit = 'cover';
	videoInitialized = true;
	update();
});

setTimeout(function () {
	if (videoInitialized || !studiorichter.bbcc.videoLogo) return;

	videoInitialized = true;
	console.log('video fallback init');
	update();
}, 5000);

// colored lines for termine
var colorLines = document.querySelectorAll('.termine .date, .termine .info');

const seasonColorTop = new Color('#'+document.body.dataset.color1);
const seasonColorBottom = new Color('#'+document.body.dataset.color2);
console.log('Season colors', seasonColorTop, seasonColorBottom);

// create a blend between the season colors
const blend = seasonColorTop.steps(seasonColorBottom, {
	space: "lch",
	outputSpace: "srgb",
	maxDeltaE: 3,
	maxSteps: Math.floor(colorLines.length/2)
});

/*
// color blend sample display
for (const color of blend) {
	const ele = document.createElement('div');
	ele.style.width = '100px';
	ele.style.height = '10px';
	ele.style.backgroundColor = color.to('srgb') + '';

	document.body.prepend(ele);
}
*/

// color lines for termine
for (var i = 0; i < colorLines.length; i+=2) {
	const index = Math.floor(i/2);

	colorLines[i].style.transitionDelay = (index * 100 * 4) + 'ms';
	colorLines[i+1].style.transitionDelay = (index * 100 * 4) + 'ms';

	colorLines[i].style.borderColor = blend[index].to('srgb') + '';
	colorLines[i+1].style.borderColor = blend[index].to('srgb') + '';
}

// additional color lines after termine
document.querySelectorAll('.colorline').forEach(function (e, i) {
	e.style.transitionDelay = ((i * 100 * 4) + (colorLines.length / 2 * 100 * 4)) + 'ms';
	e.style.borderColor = blend[blend.length-1].to('srgb') + '';
});

// make band names clickable
var bandNames = document.querySelectorAll('.termine .info em, .termine .band-more');
bandNames.forEach(function(e) {
	e.addEventListener('click', function(f) {
		f.preventDefault();
		var detailElement = this.parentElement.querySelector('.detail');
		if(detailElement) {

			if(!detailElement.classList.contains('open')) {
				// close all other detail fields
				document.querySelectorAll('.termine .info .detail').forEach(function(g) {
					g.classList.remove('open');
				});

				detailElement.classList.toggle('open');
			} else {
				// just close this one
				detailElement.classList.remove('open');
			}
		}
	});
});

// extended intro text
var intro = document.querySelector('.intro');
var fulltext = document.querySelector('.description');
var button = document.querySelector('#toggle-intro');
button.addEventListener('click', function(e) {
	e.preventDefault();
	intro.classList.toggle('hidden');
	fulltext.classList.toggle('hidden');
});

var button2 = document.querySelector('#hide-extended-intro');
button2.addEventListener('click', function(e) {
	e.preventDefault();
	intro.classList.toggle('hidden');
	fulltext.classList.toggle('hidden');
});
import Color from './color.min.js';
import Two from './two.module.js';
import Matter from './matter.module.js';

var studiorichter = {
	'bbcc': {}
};

const p3Browser = window.matchMedia('(color-gamut: p3)').matches;
const p3Display = CSS.supports('color: color(display-p3 1 1 1)');

console.log('init', ((p3Browser && p3Display) ? 'p3' : 'srgb') + ' mode');

// get season colors
const seasonColorTop = new Color(getComputedStyle(document.documentElement).getPropertyValue('--season-color-top'));
const seasonColorBottom = new Color(getComputedStyle(document.documentElement).getPropertyValue('--season-color-bottom'));

// console.log('Season colors', seasonColorTop, seasonColorBottom);

// colored lines for termine
var colorLines = document.querySelectorAll('.termin');

// create a blend between the season colors
const blend = seasonColorTop.steps(seasonColorBottom, {
	space: "lch",
	outputSpace: (p3Browser && p3Display) ? 'p3' : 'srgb',
	maxDeltaE: 3,
	maxSteps: colorLines.length
});

// color lines for termine
colorLines.forEach(function (line, index) {
	line.style.transitionDelay = (index * 100 * 4) + 'ms';
	line.style.borderColor = blend[index].toString({ format: 'color' });
});

// additional color lines after termine
document.querySelectorAll('.colorline').forEach(function (e, i) {
	e.style.transitionDelay = ((i * 100 * 4) + (colorLines.length / 2 * 100 * 4)) + 'ms';
	e.style.borderColor = blend[blend.length-1].toString({ format: 'color' });
});

// 2025 - matter/two.js animation

const container = document.querySelector('#canvas');

let letters = [];
let engine;

const maxSize = 672; // magic number, max width of svg element in px
let factor = container.offsetWidth / maxSize; // determine scale factor
let resizeTimeout;
let currentWidth = window.innerWidth;

console.log('init with', container.offsetWidth);

const offsets = {
	'B':  [container.offsetWidth/100*20, container.offsetWidth/100*5],
	'I':  [container.offsetWidth/100*50, container.offsetWidth/100*5],
	'G':  [container.offsetWidth/100*70, container.offsetWidth/100*5],
	'B2': [container.offsetWidth/100*20, container.offsetWidth/100*50],
	'A':  [container.offsetWidth/100*40, container.offsetWidth/100*50],
	'N':  [container.offsetWidth/100*60, container.offsetWidth/100*50],
	'D':  [container.offsetWidth/100*80, container.offsetWidth/100*50]
};

Matter.Common._seed = Math.random().toString().slice(2,10); // random 8 digit number
console.log('seed', Matter.Common._seed); // good seed 63512483

const two = new Two({
	type: Two.Types.svg, //canvas, svg, webgl?
	fitted: true,
	autostart: true
}).appendTo(container);

two.bind('update', update);

function update (frameCount, timeDelta) {
	//console.log('update');
	
	var allBodies = Matter.Composite.allBodies(engine.world);
	// Matter.MouseConstraint.update(mouseConstraint, allBodies);
	// Matter.MouseConstraint._triggerEvents(mouseConstraint);

	// update matter.js physics
	Matter.Engine.update(engine);

	// update all letter renders according to matter.js proxies
	for (const letter of letters) {
		// console.log(letter.entity);
		// var entity = letter;
		letter.position.copy(letter.entity.position);
		letter.rotation = letter.entity.angle;
	}
}

function reset () {
	console.log('reset scene');

	// clear two.js objects
	two.remove(letters);
	letters = [];

	// clear matter
	if (engine && engine.world) Matter.World.clear(engine.world);
	if (engine) Matter.Engine.clear(engine);
	// Events.off(engine, 'beforeUpdate', eventCallback);

	// create engine
	engine = Matter.Engine.create();
	// engine.gravity.scale = 0;

	// import shapes
	const letterPaths = document.querySelectorAll('#letters svg path');
	letterPaths.forEach(function (ele, i) {
		const fill = ele.getAttribute('fill');
		let color = fill;
		if (ele.classList.contains('color-1')) color = seasonColorTop.to('srgb').toString({ format: 'hex' });
		if (ele.classList.contains('color-2')) color = seasonColorBottom.to('srgb').toString({ format: 'hex' });
		// console.log(color);
		ele.setAttribute('fill', color);

		const id = ele.getAttribute('id').replace('letter-', '');

		const offsetX = offsets[id][0];
		const offsetY = offsets[id][1];

		const letter = two.interpret(ele);
		letter.scale = factor * 1.05;
		letters.push(letter);

		letter.position.x = offsetX;
		letter.position.y = offsetY;

		const letterDimensions = letter.getBoundingClientRect();
		// console.log(letter.position, letterDimensions);

		const invisibleBorder = 4;

		// make a rectangular stand-in for physics
		// it is scaled like the pre-scaled SVG path
		letter.entity = Matter.Bodies.rectangle(
			offsetX-invisibleBorder,
			offsetY-invisibleBorder,
			letterDimensions.width+invisibleBorder,
			letterDimensions.height+invisibleBorder,
			{
				restitution: 0.7,
				label: 'Letter-' + id
			}
		);

		letter.entity.position = letter.position;

		// rotation
		const rot = Matter.Common.random(-0.3, 0.3);
		Matter.Body.rotate(letter.entity, rot);
		Matter.Body.setMass(letter.entity, 5);

		Matter.Composite.add(engine.world, letter.entity, true);

		// console.log(id, color, letter, letter.entity);
	});

	// setup walls
	// these walls are invisible and don't have two.JS representations
	var ground = Matter.Bodies.rectangle(container.offsetWidth/2, container.offsetWidth, container.offsetWidth, 10, { isStatic: true });
	var wallLeft = Matter.Bodies.rectangle(0, container.offsetWidth/2, 10, container.offsetWidth, { isStatic: true });
	var wallRight = Matter.Bodies.rectangle(container.offsetWidth, container.offsetWidth/2, 10, container.offsetWidth, { isStatic: true });

	// add all of the bodies to the world
	Matter.Composite.add(engine.world, [wallLeft, wallRight, ground]); // [boxA, boxB, ground]
	// console.log(Matter.Composite.allBodies(engine.world));
	// give an initial impulse
	setTimeout(jolt, 400, 1.15);
}

reset(); // init

setInterval(jolt, 7000);

function jolt (scale) {
	if (scale) {
		scaleLetters(scale);
	}

	letters.forEach(function (ele, i) {
		const dir = Matter.Common.random(-0.3, 0.3);
		const impulse = Matter.Common.random(-0.2, -0.55);
		Matter.Body.applyForce(ele.entity, { x: ele.position.x, y: ele.position.y }, { x: dir, y: -impulse });
	});
}

function scaleLetters (scale) {
	letters.forEach(function (ele, i) {
		ele.scale = ele.scale * scale;
		Matter.Body.scale(ele.entity, scale, scale);
	});
}

// get a two.js body from a DOM node
function domToTwo (element) {
	if (!element) return false;
	let obj = two.scene.children.find(o => o.id === element.id);
	return obj || false;
}

// get a reference to a DOM node from a two.js body
function twoToDom (twoEntity) {
	const ele = canvas.querySelector('#'+twoEntity.id);
	return ele || false;
}

document.documentElement.addEventListener('click', function (event) {
	const letter = domToTwo(event.target.closest('path'));
	if (!letter) return;

	// letter.fill = Matter.Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1']);

	const dir = Matter.Common.random(-0.3, 0.3);
	const impulse = Matter.Common.random(-0.55, -0.75);
	Matter.Body.applyForce(letter.entity, { x: letter.entity.position.x, y: letter.entity.position.y }, { x: dir, y: -impulse });
});

document.querySelector('button')?.addEventListener('click', function (event) {
	// reset();
	jolt();
});

window.addEventListener("resize", function () {

	// mobile safari triggers resize on scroll? wtf?
	if (currentWidth == window.innerWidth) return; // ignore!

	two.renderer.setSize(canvas.offsetWidth, canvas.offsetWidth); // set to square!

	// update scaling by redrawing
	factor = container.offsetWidth / maxSize;
	console.log('resize', Math.ceil(two.width), factor.toFixed(2));

	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(reset, 1000);
});

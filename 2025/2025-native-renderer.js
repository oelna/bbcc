import Color from './color.min.js';

var studiorichter = {
	'bbcc': {
		'phpversion': '<?= phpversion() ?>'
	}
};

const p3Browser = window.matchMedia('(color-gamut: p3)').matches;
const p3Display = CSS.supports('color: color(display-p3 1 1 1)');

console.log('init', ((p3Browser && p3Display) ? 'p3' : 'srgb') + ' mode');

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

// colored lines for termine
var colorLines = document.querySelectorAll('.termine .date, .termine .info');

const seasonColorTop = new Color(document.body.dataset.color1);
const seasonColorBottom = new Color(document.body.dataset.color2);
console.log('Season colors', seasonColorTop, seasonColorBottom);

// create a blend between the season colors
const blend = seasonColorTop.steps(seasonColorBottom, {
	space: "lch",
	outputSpace: (p3Browser && p3Display) ? 'p3' : 'srgb',
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
		console.log(detailElement);
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
button?.addEventListener('click', function(e) {
	e.preventDefault();
	intro.classList.toggle('hidden');
	fulltext.classList.toggle('hidden');
});

var button2 = document.querySelector('#hide-extended-intro');
button2?.addEventListener('click', function(e) {
	e.preventDefault();
	intro.classList.toggle('hidden');
	fulltext.classList.toggle('hidden');
});

// 2025

// provide concave decomposition support library
// Common.setDecomp(require('poly-decomp'));

Matter.Common._seed = Math.random().toString().slice(2,10); // random 8 digit number
console.log('seed', Matter.Common._seed);

// Matter.use(MatterAttractors);

// create engine
var engine = Matter.Engine.create();
// engine.gravity.scale = 0;



// const worldScale = 1;

const currentWidth = document.querySelector('#canvas').offsetWidth * 2;
console.log('init with', currentWidth);

// create a renderer
var render = Matter.Render.create({
	element: document.querySelector('#canvas'),
	engine: engine,
	options: {
		width: currentWidth, 
		height: currentWidth,
		background: 'transparent',
		wireframes: false,
		showAngleIndicator: false
	}
});
render.canvas.style.cursor = "grab";

const offsets = {
	'B':  [currentWidth/100*20, currentWidth/100*5],
	'I':  [currentWidth/100*50, currentWidth/100*5],
	'G':  [currentWidth/100*70, currentWidth/100*5],
	'B2': [currentWidth/100*20, currentWidth/100*50],
	'A':  [currentWidth/100*40, currentWidth/100*50],
	'N':  [currentWidth/100*60, currentWidth/100*50],
	'D':  [currentWidth/100*80, currentWidth/100*50]
};

document.querySelectorAll('#letters path').forEach(function (ele, i) {
	console.log(ele, i);
	// var color = Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1']);
	const color = ele.getAttribute('fill');
	const id = ele.getAttribute('id').replace('letter-', '');
	// console.log(color);

	// console.log(id, ele);

	// var vertexSets = select(root, 'path')
		// .map(function(path) { return Svg.pathToVertices(path, 30); });
	var vertexSets = Matter.Svg.pathToVertices(ele, 30);

	const offsetX = offsets[id][0];
	const offsetY = offsets[id][1];

	// const offsetX = Matter.Common.random(0, 400);
	// const offsetY = Matter.Common.random(0, 200);

	var letter = Matter.Bodies.fromVertices(offsetX, offsetY, vertexSets, {
		render: {
			fillStyle: color,
			strokeStyle: color,
			lineWidth: 1,
			opacity: 1
		},
		restitution: 0.7,
		label: 'Letter-' + id
		// density:0.2, className:"letter", width:100, height:100
	});
	// console.log(letter);

	Matter.Body.rotate(letter, Matter.Common.random(-0.3, 0.3));
	Matter.Body.scale(letter, 2.6, 2.6);
	Matter.Body.setMass(letter, 5.01);
	//letter.friction = 0.05;
	//letter.frictionAir = 0.0005;
	// letter.restitution = 0.7;

	/*
	var ball = Bodies.circle(xPosition, yPosition, 25, {
	  force: {
	    x: rand(-0.0005, 0.01),
	    y: -0.01
	  },
	  restitution: 0.75,
	  render: {
	    fillStyle: '#A87FB5',
	  },
	});
	*/
	console.log(letter);

	Matter.Composite.add(engine.world, letter, true);
});



// loadLetter('./bbcc-single-B2.svg', 100, 50, worldScale);
// loadLetter('./bbcc-single-I.svg', 200, 50, worldScale);
// loadLetter('./bbcc-single-G.svg', 300, 50, worldScale);
// loadLetter('./bbcc-single-N.svg', 300, 250, worldScale);
// loadLetter('./bbcc-single-B3.svg', 100, 250, worldScale);
// loadLetter('./bbcc-single-complete.svg', 400, 50, worldScale);



/*
([
	'./bbcc-single-B2.svg', 
	'./bbcc-single-B2.svg',
	'./bbcc-single-B2.svg',
	'./bbcc-single-B2.svg'
]).forEach(function(path, i) { 
	loadSvg(path).then(function(root) {
		var color = Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1']);
		color = '#ff00ff';

		var vertexSets = select(root, 'path')
			.map(function(path) { return Vertices.scale(Svg.pathToVertices(path, 30), 0.4, 0.4); });

		Composite.add(world, Bodies.fromVertices(100 + i * 150, 200 + i * 50, vertexSets, {
			render: {
				fillStyle: color,
				strokeStyle: color,
				lineWidth: 1
			}
		}, true));
	});
});
*/

// create two boxes and a ground
//var boxA = Bodies.rectangle(400, 200, 80, 80);
//var boxB = Bodies.rectangle(450, 50, 80, 80);
const wallstyle = { fillStyle: 'transparent' };
var ground = Matter.Bodies.rectangle(currentWidth/2, currentWidth, currentWidth, 10, { isStatic: true, render: wallstyle });
var wallLeft = Matter.Bodies.rectangle(0, currentWidth/2, 10, currentWidth, { isStatic: true, render: wallstyle });
var wallRight = Matter.Bodies.rectangle(currentWidth, currentWidth/2, 10, currentWidth, { isStatic: true, render: wallstyle });

// wallLeft.render.fillStyle = '#754C82';

// add all of the bodies to the world
Matter.Composite.add(engine.world, [wallLeft, wallRight, ground]); // [boxA, boxB, ground]

// run the renderer
Matter.Render.run(render);

const mouseConstraint = Matter.MouseConstraint.create(
	engine,
	Matter.Mouse.create(render.canvas),
	{}
);

// create runner
var runner = Matter.Runner.create();

Matter.Events.on(runner, "tick", event => {
  //var foundBodies = Matter.Query.point(Composite.allBodies(engine.world), event.mouse.position);
	//console.log();

/*
  if (mouseConstraint.body) {
  	// console.log(event, mouseConstraint);
  	console.log(mouseConstraint.body);
  	mouseConstraint.body.render.fillStyle = Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1']);
    // Matter.Composite.remove(engine.world, mouseConstraint.body);
  }
  */
});

Matter.Events.on(mouseConstraint, "mousedown", (event) => {
	//console.dir(event);
	//console.log(event.source.body);
	const target = event.source.body;
	if (target) {
		// console.log(event, mouseConstraint);
		console.log(target);
		target.render.fillStyle = Matter.Common.choose(['#f19648', '#f5d259', '#f55a3c', '#063e7b', '#ececd1']);
		// target.render.fillStyle = 'red';
		// target.render.opacity = 0.5;
		// Matter.Composite.remove(engine.world, target);
		/* Matter.Body.setVelocity(
			target,
			{ x: 0, y: 70 }
		); */
		/*
		if (target.isScaled) {
			Matter.Body.scale(target, 0.8, 0.8);
			target.isScaled = true;
		}
		*/
		const dir = Matter.Common.random(-0.3, 0.3);
		Matter.Body.applyForce(target, { x: target.position.x, y: target.position.y }, { x: dir, y: -0.2 });
		console.log(target);
	}
});

// run the engine
Matter.Runner.run(runner, engine);

const jolt = function () {
	Matter.Composite.allBodies(engine.world).forEach(function (ele, i) {
		const id = ele.label.replace('Letter-', '');
		//console.log(ele, id);
		if (id && offsets[id]) {
			const dir = Matter.Common.random(-0.3, 0.3);
			const impulse = Matter.Common.random(-0.25, -0.5);
			Matter.Body.applyForce(ele, { x: ele.position.x, y: ele.position.y }, { x: dir, y: -impulse });

			// only shrink once
			if (!ele.isScaled) {
				Matter.Body.scale(ele, 0.85, 0.85);
				ele.isScaled = true;
			}
		}
	});
}

setInterval(jolt, 7000);

const reset = function () {
	console.log('reset');
	Matter.Composite.allBodies(engine.world).forEach(function (ele, i) {
		const id = ele.label.replace('Letter-', '');
		// console.log(id);
		if (id && offsets[id]) {
			console.log(id, ele.angle, ele);

			// Matter.Body.applyForce(ele, { x: ele.position.x, y: ele.position.y }, { x: 0, y: -0.2 });
			//Matter.Body.setStatic(ele, true);
			//ele.isStatic = true;
			//Matter.Body.setVelocity(ele, 0);
			//Matter.Body.setAngularVelocity(ele, 0);
			// Matter.Body.setInertia(ele, Infinity);
			Matter.Body.setPosition(ele, { x: offsets[id][0], y: offsets[id][1] });
			
			ele.force = { x: 0, y: 0 };
			// ele.angle = 0;
			// ele.rotation = 0;
			// const angle = ele.angle * -1;
			// console.log(ele.angle);
			//Matter.Body.rotate(ele, Math.PI * 2);
			// Matter.Body.translate( ele, { x: 0, y: -380 }); // jump
			// Matter.Body.set(ele, "position", { x: offsets[id][0], y: offsets[id][1] })
			setTimeout(function (ele) {
				// ele.isStatic = false;
				
				//ele.mass = 0.01;
			}, 1000, ele);
		}
	});
}

document.querySelector('button').addEventListener('click', function (event) {
	// reset();
	jolt();
});

window.addEventListener("resize", function () {
	/* // todo: make responsive
	canvas.width = container.offsetWidth;
	canvas.height = container.offsetHeight
	Matter.Body.setPosition(ground, {x: canvas.width / 2, y: canvas.height + 30})
	Matter.Body.setPosition(wallRight, {x: canvas.width + 30, y: canvas.height / 2})
	*/
});
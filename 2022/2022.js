import { quakelight } from './lights.js'

window.studiorichter = {};
window.studiorichter.bbcc = {};

window.studiorichter.bbcc.version = 1;
window.studiorichter.bbcc.ql = new quakelight();

(function () {
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

	// slowly fade in laser lights
	var elements = document.querySelectorAll('[data-color]');
	var elementCollection = [];

	elements.forEach(function(e) {
		var color = e.dataset.color;
		elementCollection.push({ 'e': e, 'color': color });
	});

	var interval = setInterval(function(e) {
		if (elementCollection.length < 1) {
			clearInterval(interval);
			return;
		}

		var firstElement = elementCollection.shift();

		firstElement.e.style.borderColor = '#'+firstElement.color;
		firstElement.e.nextElementSibling.style.borderColor = '#'+firstElement.color;
	}, 300);

	// make band names clickable
	var bandNames = document.querySelectorAll('.termine dd em, .termine .band-more');
	bandNames.forEach(function (e) {
		e.addEventListener('click', function(f) {
			f.preventDefault();
			const detailElement = this.closest('dd').querySelector('.detail');
			const arrow = this.closest('dd').querySelector('svg.arrow');
			
			if (detailElement) {

				if (!detailElement.classList.contains('open')) {
					// close all other detail fields
					document.querySelectorAll('.termine dd .detail').forEach(function(g) {
						g.classList.remove('open');
					});

					detailElement.classList.toggle('open');
					if (arrow) {
						arrow.classList.toggle('open');
					}
				} else {
					// just close this one
					detailElement.classList.remove('open');
					if (arrow) {
						arrow.classList.remove('open');
					}
				}
			}
		});
	});

	var intro = document.querySelector('.intro');
	var fulltext = document.querySelector('.description');
	var button = document.querySelector('#toggle-intro');
	button.addEventListener('click', function (e) {
		e.preventDefault();
		intro.classList.toggle('hidden');
		fulltext.classList.toggle('hidden');
	});

	var button2 = document.querySelector('#hide-extended-intro');
	button2.addEventListener('click', function (e) {
		e.preventDefault();
		intro.classList.toggle('hidden');
		fulltext.classList.toggle('hidden');
	});

	// do logo flicker stuff
	const logo = document.querySelector('.logo');

	logo.addEventListener('load', function () {
		setTimeout(function () {
			const letter = logo.contentDocument.querySelector('.letter-6');
			letter.style.animation = 'none'; // otherwise it won't run

			// add actual flicker animation
			window.studiorichter.bbcc.ql.add(letter, 10);
		}, 14000);
	}, false);

})();
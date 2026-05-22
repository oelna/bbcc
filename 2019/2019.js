var studiorichter = window.studiorichter || {};
studiorichter.bbcc = studiorichter.bbcc || {};

studiorichter.bbcc.version = 1;

// document.addEventListener('DOMContentLoaded', function() {
(function() {
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
		if(elementCollection.length < 1) {
			clearInterval(interval);
			return;
		}

		var firstElement = elementCollection.shift();

		firstElement.e.style.borderColor = '#'+firstElement.color;
		firstElement.e.nextElementSibling.style.borderColor = '#'+firstElement.color;
	}, 300);

	// make band names clickable
	var bandNames = document.querySelectorAll('.termine dd em, .termine .band-more');
	bandNames.forEach(function(e) {
		e.addEventListener('click', function(f) {
			f.preventDefault();
			var detailElement = this.parentElement.querySelector('.detail');
			if(detailElement) {

				if(!detailElement.classList.contains('open')) {
					// close all other detail fields
					document.querySelectorAll('.termine dd .detail').forEach(function(g) {
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

})();
// });

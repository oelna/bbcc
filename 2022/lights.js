class quakelight {

	/*
	quakelight ESM by:
	Arno Richter (2022) - https://github.com/oelna

	original flicker code:
	https://github.com/id-Software/Quake/blob/bf4ac424ce754894ac8f1dae6a3981954bc9852d/qw-qc/world.qc

	*/

	constructor (fps) {
		const self = this;

		this.fps = fps || 100;
		this.flickerStrings = [
			'm', // 0 normal
			'mmnmmommommnonmmonqnmmo', // 1 FLICKER (first variety)
			'abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba', // 2 SLOW STRONG PULSE
			'mmmmmaaaaammmmmaaaaaabcdefgabcdefg', // 3 CANDLE (first variety)
			'mamamamamama', // 4 FAST STROBE
			'jklmnopqrstuvwxyzyxwvutsrqponmlkj', // 5 GENTLE PULSE 1
			'nmonqnmomnmomomno', // 6 FLICKER (second variety)
			'mmmaaaabcdefgmmmmaaaammmaamm', // 7 CANDLE (second variety)
			'mmmaaammmaaammmabcdefaaaammmmabcdefmmmaaaa', // 8 CANDLE (third variety)
			'aaaaaaaazzzzzzzz', // 9 SLOW STROBE (fourth variety)
			'mmamammmmammamamaaamammma', // 10 FLUORESCENT FLICKER
			'abcdefghijklmnopqrrqponmlkjihgfedcba' // 11 SLOW PULSE NOT FADE TO BLACK
		];

		document.querySelectorAll('.quakelight').forEach(function (ele, i) {
			self.add(ele);
		});
	}

	remove (ele) {
		clearInterval(ele.qlInterval);
		delete ele.qli;
		if (ele.qlo) {
			ele.style.opacity = ele.qlo;
			delete ele.qlo;
		}
		ele.classList.remove('ql-running');
	}

	removeAll () {
		const self = this;
		document.querySelectorAll('.ql-running').forEach(function (ele, i) {
			self.remove(ele);
		});
	}

	add (ele, val) {
		if (!ele) return;

		let preset = ele.getAttribute('data-preset');
		let lightstr = ele.getAttribute('data-lightstring');

		if (val) {
			if (Number.isInteger(val)) {
				preset = val;
			} else {
				lightstr = val;
			}
		}

		let str = this.flickerStrings[0];
		if (lightstr) {
			// console.log('using custom string', lightstr);
			str = lightstr;
		} else if (preset) {
			// console.log('using preset', preset);
			if (this.flickerStrings[preset]) {
				str = this.flickerStrings[preset];
			}
		} else return;

		ele.qli = 0;
		ele.qlo = window.getComputedStyle(ele).getPropertyValue('opacity'); // original opacity value
		ele.classList.add('ql-running');
		ele.qlInterval = setInterval(function (self) {
			const num = str[ele.qli].charCodeAt(0) - 97;
			const percent = num / 25;

			self.style.opacity = percent.toFixed(2);

			ele.qli += 1;
			if (ele.qli >= str.length) { ele.qli = 0; }
		}, this.fps, ele);
	}
}

export { quakelight }

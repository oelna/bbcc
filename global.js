
const siteFooter = document.querySelector('footer');
const sitePath = window.location.pathname.split('/').filter(v => v !== '');

document.documentElement.classList.remove('no-js');

try {
	const response = await fetch('../nav.html');
	if (!response.ok) {
		throw new Error(`Response status: ${response.status}`);
	}

	const html = await response.text();
	
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	const footerElements = doc.querySelectorAll('footer > *');

	// insert into each page's footer element
	siteFooter.replaceChildren(...footerElements);

	highlightCurrentSeason();
} catch (error) {
	console.error('Failed to fetch navigation: ', error);
}

function highlightCurrentSeason () {
	const seasonLinks = siteFooter.querySelectorAll('nav.season > ul > li');
	const now = Date.now();
	// console.log(sitePath[0], seasonLinks);
	for (const link of seasonLinks) {
		const anchor = link.querySelector('a');
		anchor.setAttribute('href', '..' + anchor.getAttribute('href'));

		// console.log(link, anchor.getAttribute('href'), '../'+sitePath[0]+'/');

		if (anchor.getAttribute('href') == '../'+sitePath[0]+'/') {
			link.classList.add('current');
			anchor.setAttribute('aria-current', 'page');
		}

		// progressive reveal of future seasons
		if (link.dataset.reveal) {
			const datetime = Date.parse(link.dataset.reveal + 'T00:00:00Z');

			if (datetime < now) {
				link.removeAttribute('data-reveal');
			}
		}
	}
}

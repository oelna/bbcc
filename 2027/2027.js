import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm";
import { SVGLoader } from "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/loaders/SVGLoader.js/+esm";

let logoCenterY = 0;

const FLOOR_Y = -3; // top surface of the floor
const FLOOR_WIDTH = 50;
const FLOOR_DEPTH = 100;
const FLOOR_THICKNESS = 0.5;

const ROW_GAP_Y = 0.05; // vertical gap between BAND and BIG

const CAMERA_Z = 15;	// smaller = closer, larger = farther
const CAMERA_FOV = 28;	// smaller = more zoomed-in, larger = wider

const pointerNdc = new THREE.Vector2();
const pointerRaycaster = new THREE.Raycaster();
const logoHitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const CLICK_HIT_RANDOMNESS_X = 0.12;
const CLICK_HIT_RANDOMNESS_Y = 0.12;

const container = document.querySelector("#canvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
// renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
	CAMERA_FOV,
	container.clientWidth / container.clientHeight,
	0.1,
	200
);

camera.position.set(0, logoCenterY, CAMERA_Z);
camera.lookAt(0, logoCenterY, 0);

function resizeRendererToContainer() {
	const width = container.clientWidth;
	const height = container.clientHeight;

	if (width === 0 || height === 0) {
		return false;
	}

	const canvas = renderer.domElement;

	const needsResize =
		canvas.width !== Math.floor(width * renderer.getPixelRatio()) ||
		canvas.height !== Math.floor(height * renderer.getPixelRatio());

	if (!needsResize) {
		return false;
	}

	renderer.setSize(width, height, false);

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	return true;
}

resizeRendererToContainer();

// react to window resizing
const resizeObserver = new ResizeObserver(() => {
	resizeRendererToContainer();
});

resizeObserver.observe(container);

window.addEventListener("orientationchange", () => {
	setTimeout(resizeRendererToContainer, 100);
});

const ambient = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1.8);
directional.position.set(4, 8, 10);
directional.castShadow = true;
scene.add(directional);

const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, 0, 0)
	// gravity: new CANNON.Vec3(0, -9.82, 0)
});

const syncList = [];
const ballBodies = [];

let interactionState = "loading";
let initialFireTimeout = null;

function getPointerHitPoint(event) {
	const rect = renderer.domElement.getBoundingClientRect();

	pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

	pointerRaycaster.setFromCamera(pointerNdc, camera);

	const hitPoint = new THREE.Vector3();
	pointerRaycaster.ray.intersectPlane(logoHitPlane, hitPoint);

	return hitPoint;
}

function buildSinglePathSvgMarkup(sourceSvgEl, pathEl) {
	const viewBox = sourceSvgEl.getAttribute("viewBox") || "0 0 200 200";
	const d = pathEl.getAttribute("d");
	const fill = pathEl.getAttribute("fill") || "#ffffff";

	return `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
			<path d="${d}" fill="${fill}" />
		</svg>
	`;
}

function getLetterColor(pathEl, fallbackColor) {
	const fill = pathEl.getAttribute("fill");
	if (fill) {
		return fill;
	}
	return fallbackColor;
}

async function loadLetterMeshFromSvgNode(sourceSvgEl, pathId, depth = 1.5, svgScale = 0.01, fallbackColor = 0xffffff) {
	const pathEl = sourceSvgEl.querySelector(`#${CSS.escape(pathId)}`);

	if (!pathEl) {
		throw new Error(`Could not find SVG path with id "${pathId}"`);
	}

	const svgMarkup = buildSinglePathSvgMarkup(sourceSvgEl, pathEl);

	const loader = new SVGLoader();
	const data = loader.parse(svgMarkup);

	const resolvedColor = getLetterColor(pathEl, fallbackColor);

	const frontMaterial = new THREE.MeshStandardMaterial({
		color: resolvedColor,
		roughness: 0.45,
		metalness: 0.0
	});

	const sideMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color(resolvedColor).multiplyScalar(0.65),
		roughness: 0.55,
		metalness: 0.0
	});

	const group = new THREE.Group();

	for (const path of data.paths) {
		const shapes = SVGLoader.createShapes(path);

		for (const shape of shapes) {
			const geometry = new THREE.ExtrudeGeometry(shape, {
				depth,
				bevelEnabled: true,
				bevelThickness: 0.04,
				bevelSize: 0.04,
				bevelSegments: 1
			});

			const mesh = new THREE.Mesh(geometry, [
				frontMaterial,
				sideMaterial
			]);

			mesh.castShadow = true;
			mesh.receiveShadow = true;
			group.add(mesh);
		}
	}

	const preBox = new THREE.Box3().setFromObject(group);
	const center = preBox.getCenter(new THREE.Vector3());

	for (const child of group.children) {
		child.position.x -= center.x;
		child.position.y -= center.y;
		child.position.z -= depth / 2;
	}

	// Preserve visible extrusion depth
	group.scale.set(svgScale, -svgScale, 1);

	const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());

	size.set(
		Math.abs(size.x),
		Math.abs(size.y),
		Math.abs(size.z)
	);

	return {
		group,
		size
	};
}

async function loadLetterMesh(url, color, depth = 1.5, svgScale = 0.01) {
	const loader = new SVGLoader();
	const data = await loader.loadAsync(url);

	const frontMaterial = new THREE.MeshStandardMaterial({
		color,
		roughness: 0.45,
		metalness: 0.0
	});

	const sideMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color(color).multiplyScalar(0.65),
		roughness: 0.55,
		metalness: 0.0
	});

	const group = new THREE.Group();

	for (const path of data.paths) {
		const shapes = SVGLoader.createShapes(path);

		for (const shape of shapes) {
			const geometry = new THREE.ExtrudeGeometry(shape, {
				depth,
				bevelEnabled: true,
				bevelThickness: 0.04,
				bevelSize: 0.04,
				bevelSegments: 1
			});

			const mesh = new THREE.Mesh(geometry, [
				frontMaterial,
				sideMaterial
			]);

			mesh.castShadow = true;
			mesh.receiveShadow = true;

			group.add(mesh);
		}
	}

	const box = new THREE.Box3().setFromObject(group);
	const center = box.getCenter(new THREE.Vector3());

	for (const child of group.children) {
		child.position.x -= center.x;
		child.position.y -= center.y;
		child.position.z -= depth / 2;
	}

	// Important:
	// Scale X/Y from SVG units into scene units,
	// but leave Z alone so extrusion depth stays visible.
	group.scale.set(svgScale, -svgScale, 1);

	const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());

	size.set(
		Math.abs(size.x),
		Math.abs(size.y),
		Math.abs(size.z)
	);

	return {
		group,
		size
	};
}

function addLetterBody(letter, x, bottomY, z = 0, mass = 3) {
	const centerY = bottomY + letter.size.y / 2;

	letter.group.position.set(x, centerY, z);
	scene.add(letter.group);

	const halfExtents = new CANNON.Vec3(
		letter.size.x / 2,
		letter.size.y / 2,
		letter.size.z / 2
	);

	const body = new CANNON.Body({
		mass,
		shape: new CANNON.Box(halfExtents),
		position: new CANNON.Vec3(x, centerY, z)
	});

	body.linearDamping = 0.12;
	body.angularDamping = 0.12;
	body.allowSleep = true;
	body.sleepSpeedLimit = 0.15;
	body.sleepTimeLimit = 0.5;

	world.addBody(body);

	syncList.push({
		mesh: letter.group,
		body,
		originalPosition: new CANNON.Vec3(
			body.position.x,
			body.position.y,
			body.position.z
		),
		originalQuaternion: new CANNON.Quaternion(
			body.quaternion.x,
			body.quaternion.y,
			body.quaternion.z,
			body.quaternion.w
		)
	});

	return body;
}

async function buildRow(defs, y, gap = 0.12) {
	const built = [];

	for (const def of defs) {
		const letter = await loadLetterMesh(
			def.url,
			def.color,
			def.depth ?? 0.8,
			def.scale ?? 0.01
		);

		built.push({
			...def,
			...letter
		});
	}

	let totalWidth = 0;

	for (const item of built) {
		totalWidth += item.size.x;
	}

	totalWidth += gap * (built.length - 1);

	let cursor = -totalWidth / 2;

	for (const item of built) {
		const x = cursor + item.size.x / 2;
		cursor += item.size.x + gap;

		addLetterBody(item, x, y, 0, item.mass ?? 3);
	}
}

async function loadRow(defs, gap = 0.12) {
	const built = [];

	for (const def of defs) {
		const letter = await loadLetterMesh(
			def.url,
			def.color,
			def.depth ?? 0.8,
			def.scale ?? 0.01
		);

		built.push({
			...def,
			...letter
		});
	}

	let totalWidth = 0;
	let maxHeight = 0;

	for (const item of built) {
		totalWidth += item.size.x;
		maxHeight = Math.max(maxHeight, item.size.y);
	}

	totalWidth += gap * (built.length - 1);

	return {
		items: built,
		totalWidth,
		maxHeight,
		gap
	};
}

async function loadRowFromSvg(sourceSvgEl, defs, gap = 0.12) {
	const built = [];

	for (const def of defs) {
		const letter = await loadLetterMeshFromSvgNode(
			sourceSvgEl,
			def.pathId,
			def.depth ?? 1.5,
			def.scale ?? 0.01,
			def.color ?? 0xffffff
		);

		built.push({
			...def,
			...letter
		});
	}

	let totalWidth = 0;
	let maxHeight = 0;

	for (const item of built) {
		totalWidth += item.size.x;
		maxHeight = Math.max(maxHeight, item.size.y);
	}

	totalWidth += gap * (built.length - 1);

	return {
		items: built,
		totalWidth,
		maxHeight,
		gap
	};
}

function placeRow(row, bottomY, z = 0) {
	let cursor = -row.totalWidth / 2;

	for (const item of row.items) {
		const x = cursor + item.size.x / 2;
		cursor += item.size.x + row.gap;

		addLetterBody(item, x, bottomY, z, item.mass ?? 3);
	}
}

async function buildLogo() {
	const sourceSvgEl = document.querySelector("#letters");

	if (!sourceSvgEl) {
		throw new Error("Missing #letters SVG element in the DOM");
	}

	let scale = 0.015;
	let mass = 7;

	const bigRow = await loadRowFromSvg(
		sourceSvgEl,
		[
			{ pathId: "letter-B", scale: scale, depth: 1.8, mass: mass },
			{ pathId: "letter-I", scale: scale, depth: 1.8, mass: mass - 1 },
			{ pathId: "letter-G", scale: scale, depth: 1.8, mass: mass }
		],
		0.08
	);

	const bandRow = await loadRowFromSvg(
		sourceSvgEl,
		[
			{ pathId: "letter-B2", scale: scale, depth: 1.8, mass: mass },
			{ pathId: "letter-A", scale: scale, depth: 1.8, mass: mass },
			{ pathId: "letter-N", scale: scale, depth: 1.8, mass: mass },
			{ pathId: "letter-D", scale: scale, depth: 1.8, mass: mass }
		],
		0.08
	);

	const bandBottomY = FLOOR_Y;
	const bandColliderHeight = bandRow.maxHeight + 0;
	const bigBottomY = FLOOR_Y + bandColliderHeight + ROW_GAP_Y;

	placeRow(bandRow, bandBottomY, 0);
	placeRow(bigRow, bigBottomY, 0);

	const totalLogoHeight = bandRow.maxHeight + ROW_GAP_Y + bigRow.maxHeight;
	logoCenterY = FLOOR_Y + totalLogoHeight / 2;
}

function addFloor() {
	const floorGeometry = new THREE.BoxGeometry(
		FLOOR_WIDTH,
		FLOOR_THICKNESS,
		FLOOR_DEPTH
	);

	const floorMaterial = new THREE.MeshStandardMaterial({
		color: 0x000000,
		roughness: 0.9,
		metalness: 0.0
	});

	const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.receiveShadow = false;
	floorMesh.visible = false;

	// Center the mesh so its top surface sits exactly at FLOOR_Y
	floorMesh.position.set(0, FLOOR_Y - FLOOR_THICKNESS / 2, 0);

	scene.add(floorMesh);

	const floorBody = new CANNON.Body({
		type: CANNON.Body.STATIC,
		shape: new CANNON.Box(
			new CANNON.Vec3(
				FLOOR_WIDTH / 2,
				FLOOR_THICKNESS / 2,
				FLOOR_DEPTH / 2
			)
		),
		position: new CANNON.Vec3(
			0,
			FLOOR_Y - FLOOR_THICKNESS / 2,
			0
		)
	});

	world.addBody(floorBody);
}

function randomBetween(min, max) {
	return min + Math.random() * (max - min);
}

function fireInvisibleBall(targetPoint = null) {
	const radius = randomBetween(0.55, 0.8);

	const target = targetPoint
		? new CANNON.Vec3(
			targetPoint.x + randomBetween(-CLICK_HIT_RANDOMNESS_X, CLICK_HIT_RANDOMNESS_X),
			targetPoint.y + randomBetween(-CLICK_HIT_RANDOMNESS_Y, CLICK_HIT_RANDOMNESS_Y),
			0
		)
		: new CANNON.Vec3(
			randomBetween(-0.6, 0.6),
			logoCenterY + randomBetween(-0.45, 0.45),
			0
		);

	const startPosition = new CANNON.Vec3(
		target.x + randomBetween(-0.15, 0.15),
		target.y + randomBetween(-0.15, 0.15),
		8
	);

	const direction = new CANNON.Vec3(
		target.x - startPosition.x,
		target.y - startPosition.y,
		target.z - startPosition.z
	);

	direction.normalize();

	const speed = randomBetween(24, 32);

	const ballBody = new CANNON.Body({
		mass: randomBetween(35, 50),
		shape: new CANNON.Sphere(radius),
		position: startPosition
	});

	ballBody.velocity.set(
		direction.x * speed,
		direction.y * speed,
		direction.z * speed
	);

	ballBody.angularVelocity.set(
		randomBetween(-5, 5),
		randomBetween(-5, 5),
		randomBetween(-5, 5)
	);

	world.addBody(ballBody);
	ballBodies.push(ballBody);

	return ballBody;
}

function clearInitialFireTimeout() {
	if (initialFireTimeout === null) {
		return;
	}

	clearTimeout(initialFireTimeout);
	initialFireTimeout = null;
}

function removeInvisibleBalls() {
	for (const ballBody of ballBodies) {
		world.removeBody(ballBody);
	}

	ballBodies.length = 0;
}

function reassembleLetters() {
	clearInitialFireTimeout();
	removeInvisibleBalls();

	world.gravity.set(0, 0, 0);

	for (const item of syncList) {
		const { mesh, body, originalPosition, originalQuaternion } = item;

		body.velocity.set(0, 0, 0);
		body.angularVelocity.set(0, 0, 0);
		body.force.set(0, 0, 0);
		body.torque.set(0, 0, 0);

		body.position.copy(originalPosition);
		body.previousPosition.copy(originalPosition);
		body.interpolatedPosition.copy(originalPosition);

		body.quaternion.copy(originalQuaternion);
		body.previousQuaternion.copy(originalQuaternion);
		body.interpolatedQuaternion.copy(originalQuaternion);

		body.aabbNeedsUpdate = true;
		body.wakeUp();

		mesh.position.copy(originalPosition);
		mesh.quaternion.copy(originalQuaternion);
	}

	lastTime = 0;
	interactionState = "readyToFire";
}

function throwNewBall(event = null) {
	if (interactionState === "loading") {
		return;
	}

	clearInitialFireTimeout();
	removeInvisibleBalls();

	world.gravity.set(0, -9.82, 0);

	for (const item of syncList) {
		item.body.wakeUp();
	}

	const targetPoint = event ? getPointerHitPoint(event) : null;

	fireInvisibleBall(targetPoint);

	interactionState = "smashed";
}

function handleCanvasInteraction(event) {
	event.preventDefault();

	if (interactionState === "smashed") {
		reassembleLetters();
		return;
	}

	if (interactionState === "readyToFire") {
		throwNewBall(event);
	}
}

renderer.domElement.style.touchAction = "manipulation";
renderer.domElement.style.cursor = "pointer";
renderer.domElement.addEventListener("pointerdown", handleCanvasInteraction);

let lastTime = 0;

function animate(time = 0) {
	requestAnimationFrame(animate);

	const dt = Math.min((time - lastTime) / 1000 || 1 / 60, 1 / 30);
	lastTime = time;

	world.step(1 / 60, dt, 3);

	for (const item of syncList) {
		item.mesh.position.copy(item.body.position);
		item.mesh.quaternion.copy(item.body.quaternion);
	}

	renderer.render(scene, camera);
}

async function init() {
	addFloor();
	await buildLogo();

	reassembleLetters();

	initialFireTimeout = setTimeout(() => {
		if (interactionState === "readyToFire") {
			throwNewBall();
		}
	}, 2000);

	animate();
}

init();

window.addEventListener("resize", resizeRendererToContainer);

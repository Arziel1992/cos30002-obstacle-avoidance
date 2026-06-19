// ─── Vector Utilities ───────────────────────────────────────────────────────

export function magnitude(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalise(v) {
	const m = magnitude(v);
	if (m < 1e-9) return { x: 0, y: 0 };
	return { x: v.x / m, y: v.y / m };
}

function truncate(v, max) {
	const m = magnitude(v);
	if (m <= max) return v;
	const s = max / m;
	return { x: v.x * s, y: v.y * s };
}

function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function scale(v, s) { return { x: v.x * s, y: v.y * s }; }
function dot(a, b) { return a.x * b.x + a.y * b.y; }

// ─── Local-Space Transform Helpers ──────────────────────────────────────────

/**
 * Transform a world-space point into the agent's local coordinate frame.
 * Agent is at origin (0,0); heading = +X axis; side = +Y axis.
 */
export function pointToLocalSpace(worldPoint, agentPos, heading, side) {
	const delta = sub(worldPoint, agentPos);
	return {
		x: dot(delta, heading),
		y: dot(delta, side),
	};
}

/**
 * Transform a local-space vector back into world space.
 */
export function vectorToWorldSpace(localVec, heading, side) {
	return {
		x: localVec.x * heading.x + localVec.y * side.x,
		y: localVec.x * heading.y + localVec.y * side.y,
	};
}

// ─── Steering Behaviours ─────────────────────────────────────────────────────

/**
 * Reynolds Local-Space Obstacle Avoidance (Buckland 2005 / Reynolds GDC 1999).
 * Returns { force, debug } where debug carries visualisation data.
 */
export function calculateObstacleAvoidance(agent, obstacles, boxLen, params) {
	const { boundingRadius, brakingWeight, lateralMultiplier } = params;
	const heading = normalise(agent.velocity);
	const side = { x: -heading.y, y: heading.x };

	let closestDist = Number.POSITIVE_INFINITY;
	let closestObs = null;
	let closestLocal = null;

	const localObstacles = [];

	for (const obs of obstacles) {
		const local = pointToLocalSpace(obs.position, agent.position, heading, side);
		localObstacles.push({ obs, local });

		// Phase 2: forward culling — obstacle must be ahead of agent
		if (local.x < 0) continue;

		// Phase 3: only consider obstacles within the detection box length
		if (local.x > boxLen + obs.radius + boundingRadius) continue;

		// Phase 4: lateral check — expanded radius
		const expandedRadius = obs.radius + boundingRadius;
		if (Math.abs(local.y) >= expandedRadius) continue;

		// Phase 4: line-circle intersection x-coordinate
		const intersectX = local.x - Math.sqrt(expandedRadius * expandedRadius - local.y * local.y);

		// Phase 5: track the closest (most immediately threatening) obstacle
		if (intersectX < closestDist) {
			closestDist = intersectX;
			closestObs = obs;
			closestLocal = local;
		}
	}

	// Build the detection box corners in world space for visualization
	const boxHalf = (boundingRadius + 4);
	const boxCorners = [
		add(agent.position, add(scale(heading, boxLen), scale(side, -boxHalf))),
		add(agent.position, add(scale(heading, boxLen), scale(side, boxHalf))),
		add(agent.position, scale(side, boxHalf)),
		add(agent.position, scale(side, -boxHalf)),
	];

	const debug = {
		heading,
		side,
		boxCorners,
		localObstacles,
		closestLocal,
		closestObs,
		brakingMag: 0,
		lateralMag: 0,
		localForce: null,
		worldForce: null,
		phase: 0,
	};

	if (!closestObs) {
		return { force: { x: 0, y: 0 }, debug };
	}

	debug.phase = 5;

	// Phase 5: generate braking (−X) and lateral (±Y) forces in local space
	const expandedRadius = closestObs.radius + boundingRadius;
	const brakingMag = (expandedRadius - closestLocal.x) * brakingWeight;
	// Sign of lateral: push away from the side the obstacle is on
	const lateralSign = closestLocal.y < 0 ? 1 : -1;
	// Buckland proximity multiplier: the nearer the obstacle along the heading
	// axis, the harder the lateral steer — prevents under-steering on close calls.
	const proximityMult = 1 + Math.max(0, boxLen - closestLocal.x) / boxLen;
	const lateralMag =
		(expandedRadius - Math.abs(closestLocal.y)) * lateralMultiplier * lateralSign * proximityMult;

	debug.brakingMag = Math.abs(brakingMag);
	debug.lateralMag = Math.abs(lateralMag);
	debug.localForce = { x: brakingMag, y: lateralMag };

	// Phase 5: convert back to world space
	const worldForce = vectorToWorldSpace({ x: brakingMag, y: lateralMag }, heading, side);
	debug.worldForce = worldForce;

	return { force: worldForce, debug };
}

/**
 * Hard collision resolution: if the agent has penetrated an obstacle (e.g. at
 * high speed or low max force, where the steering force alone was insufficient),
 * push it back to the surface and cancel the inward velocity component. This is
 * the safety net that guarantees the agent never clips through cover.
 */
function resolveCollisions(agent, obstacles) {
	for (const obs of obstacles) {
		const delta = sub(agent.position, obs.position);
		const dist = magnitude(delta);
		const minDist = obs.radius + agent.boundingRadius;
		if (dist < minDist && dist > 1e-5) {
			const n = scale(delta, 1 / dist);
			agent.position = add(agent.position, scale(n, minDist - dist));
			const inward = dot(agent.velocity, n);
			if (inward < 0) agent.velocity = sub(agent.velocity, scale(n, inward));
		}
	}
}

/**
 * Seek steering: drives agent toward a target position.
 */
export function calculateSeek(position, target, velocity, maxSpeed) {
	const desired = scale(normalise(sub(target, position)), maxSpeed);
	return sub(desired, velocity);
}

/**
 * Edge avoidance (non-torus): steer away from borders.
 */
function calculateEdgeAvoidance(position, width, height, margin = 70) {
	const strength = 320;
	let fx = 0, fy = 0;
	if (position.x < margin) fx += strength * (1 - position.x / margin);
	if (position.x > width - margin) fx -= strength * (1 - (width - position.x) / margin);
	if (position.y < margin) fy += strength * (1 - position.y / margin);
	if (position.y > height - margin) fy -= strength * (1 - (height - position.y) / margin);
	return { x: fx, y: fy };
}

/**
 * Wander steering: jittered autonomous locomotion. via a jitter angle on a
 * projected circle (Reynolds 1999).
 */
export function calculateWander(agent, maxSpeed, wanderDist = 80, wanderRadius = 40, wanderJitter = 1.8) {
	agent.wanderAngle += (Math.random() - 0.5) * wanderJitter;
	const heading = normalise(agent.velocity.x === 0 && agent.velocity.y === 0
		? { x: 1, y: 0 } : agent.velocity);
	const circleCenter = add(agent.position, scale(heading, wanderDist));
	const wanderPt = add(circleCenter, {
		x: Math.cos(agent.wanderAngle) * wanderRadius,
		y: Math.sin(agent.wanderAngle) * wanderRadius,
	});
	const desired = scale(normalise(sub(wanderPt, agent.position)), maxSpeed);
	return sub(desired, agent.velocity);
}

// ─── Agent ──────────────────────────────────────────────────────────────────

export class Agent {
	constructor(x, y) {
		this.position = { x, y };
		const angle = Math.random() * Math.PI * 2;
		this.velocity = { x: Math.cos(angle) * 60, y: Math.sin(angle) * 60 };
		this.maxSpeed = 120;
		this.maxForce = 200;
		this.boundingRadius = 12;
		this.wanderAngle = Math.random() * Math.PI * 2;
		this.trail = [];
		this.debugAvoidance = null;
	}
}

// ─── Obstacle ────────────────────────────────────────────────────────────────

export class Obstacle {
	constructor(x, y, radius = 30) {
		this.position = { x, y };
		this.radius = radius;
	}
}

// ─── Simulation ──────────────────────────────────────────────────────────────

export class ObstacleAvoidanceSim {
	constructor() {
		this.agent = null;
		this.obstacles = [];
		this.target = null;
	}

	initialise(canvasWidth, canvasHeight) {
		this.agent = new Agent(canvasWidth / 2, canvasHeight / 2);
		this.obstacles = [];
		this.target = null;
	}

	reset(canvasWidth, canvasHeight) {
		this.initialise(canvasWidth, canvasHeight);
	}

	addObstacle(x, y, radius) {
		this.obstacles.push(new Obstacle(x, y, radius));
	}

	removeObstacleNear(x, y, threshold = 40) {
		const idx = this.obstacles.findIndex((o) => {
			const dx = o.position.x - x;
			const dy = o.position.y - y;
			return Math.sqrt(dx * dx + dy * dy) < o.radius + threshold;
		});
		if (idx !== -1) { this.obstacles.splice(idx, 1); return true; }
		return false;
	}

	clearObstacles() { this.obstacles = []; }

	setTarget(x, y) { this.target = { x, y }; }
	clearTarget() { this.target = null; }

	update(params, canvasSize, telemetry) {
		if (!this.agent) return;
		const agent = this.agent;
		const dt = 1 / 60;

		const maxSpeed = Number(params.maxSpeed);
		const maxForce = Number(params.maxForce);
		const boundingRadius = Number(params.boundingRadius);
		const detectionBoxLength = Number(params.detectionBoxLength);
		const brakingWeight = Number(params.brakingWeight);
		const lateralMultiplier = Number(params.lateralMultiplier);
		const weightAvoidance = Number(params.weightAvoidance);
		const weightSeek = Number(params.weightSeek);
		const weightWander = Number(params.weightWander);
		const showTrail = params.showTrail;
		const torus = params.torusMode;

		agent.maxSpeed = maxSpeed;
		agent.maxForce = maxForce;
		agent.boundingRadius = boundingRadius;

		// ── Gather forces ────────────────────────────────────────────
		let totalForce = { x: 0, y: 0 };

		const avoidParams = { boundingRadius, brakingWeight, lateralMultiplier };
		const { force: avoidForce, debug } = calculateObstacleAvoidance(
			agent, this.obstacles, detectionBoxLength, avoidParams,
		);
		agent.debugAvoidance = debug;

		totalForce = add(totalForce, scale(avoidForce, weightAvoidance));

		if (this.target) {
			const seekForce = calculateSeek(agent.position, this.target, agent.velocity, maxSpeed);
			totalForce = add(totalForce, scale(seekForce, weightSeek));
		} else {
			const wanderForce = calculateWander(agent, maxSpeed);
			totalForce = add(totalForce, scale(wanderForce, weightWander));
		}

		if (!torus) {
			const edge = calculateEdgeAvoidance(agent.position, canvasSize.width, canvasSize.height);
			totalForce = add(totalForce, edge);
		}

		// ── Integrate ────────────────────────────────────────────────
		const steering = truncate(totalForce, maxForce);
		agent.velocity = truncate(add(agent.velocity, scale(steering, dt)), maxSpeed);

		if (magnitude(agent.velocity) < 5 && !this.target) {
			const heading = normalise(agent.velocity.x === 0 && agent.velocity.y === 0
				? { x: 1, y: 0 } : agent.velocity);
			agent.velocity = scale(heading, 20);
		}

		agent.position = add(agent.position, scale(agent.velocity, dt));

		// ── Hard collision safety net (prevents clipping through obstacles) ──
		resolveCollisions(agent, this.obstacles);

		// ── Boundary ─────────────────────────────────────
		if (torus) {
			const margin = 40;
			if (agent.position.x < -margin) agent.position.x = canvasSize.width + margin;
			else if (agent.position.x > canvasSize.width + margin) agent.position.x = -margin;
			if (agent.position.y < -margin) agent.position.y = canvasSize.height + margin;
			else if (agent.position.y > canvasSize.height + margin) agent.position.y = -margin;
		} else {
			if (agent.position.x < 0) { agent.position.x = 0; agent.velocity.x = Math.abs(agent.velocity.x); }
			else if (agent.position.x > canvasSize.width) { agent.position.x = canvasSize.width; agent.velocity.x = -Math.abs(agent.velocity.x); }
			if (agent.position.y < 0) { agent.position.y = 0; agent.velocity.y = Math.abs(agent.velocity.y); }
			else if (agent.position.y > canvasSize.height) { agent.position.y = canvasSize.height; agent.velocity.y = -Math.abs(agent.velocity.y); }
		}

		// ── Trail ────────────────────────────────────────────────────
		if (showTrail) {
			agent.trail.push({ x: agent.position.x, y: agent.position.y });
			if (agent.trail.length > 200) agent.trail.shift();
		} else {
			agent.trail = [];
		}

		// ── Telemetry ────────────────────────────────────────────────
		const spd = magnitude(agent.velocity);
		const hdg = normalise(agent.velocity);
		telemetry.speed = spd;
		telemetry.headingDeg = Math.atan2(hdg.y, hdg.x) * 180 / Math.PI;
		telemetry.boxLength = detectionBoxLength;
		telemetry.activePhase = debug.phase;
		telemetry.brakingMag = debug.brakingMag;
		telemetry.lateralMag = debug.lateralMag;
		telemetry.obstacleCount = this.obstacles.length;
		telemetry.hasTarget = this.target !== null;
	}
}

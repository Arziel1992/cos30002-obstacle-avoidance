<script>
import { onMount } from "svelte";
import { magnitude } from "./Simulation.js";

let {
	simulation,
	params,
	containerRef,
	showTrail = $bindable(),
	showLocalAxes = $bindable(),
	showDetectionBox = $bindable(),
	showForceVectors = $bindable(),
	interactionMode = $bindable(),
} = $props();

let canvas;
let ctx;
let width = 0;
let height = 0;

const C = {
	bg: "transparent",
	grid: "rgba(0,0,0,0.03)",

	agentFill: "#3b82f6",
	agentBorder: "#2563eb",
	agentGlow: "rgba(59,130,246,0.25)",
	edgeMargin: "rgba(99,102,241,0.06)",
	edgeBorder: "rgba(99,102,241,0.18)",

	trail: "rgba(59,130,246,0.35)",
	velocity: "#fbbf24",

	boxNormal: "rgba(37,99,235,0.25)",
	boxBorder: "rgba(37,99,235,0.7)",
	boxActive: "rgba(239,68,68,0.2)",
	boxActiveBorder: "rgba(239,68,68,0.8)",

	headingAxis: "#3b82f6",
	sideAxis: "#10b981",

	obstacle: "#334155",
	obstacleBorder: "#64748b",
	obstacleHalo: "rgba(239,68,68,0.15)",

	target: "#fde047",
	targetRing: "rgba(253,224,71,0.25)",

	brakingForce: "#ef4444",
	lateralForce: "#8b5cf6",
	worldForce: "#f97316",
};

function handleResize() {
	if (!containerRef || !canvas || !ctx) return;
	const rect = containerRef.getBoundingClientRect();
	width = rect.width;
	height = rect.height;
	const dpr = window.devicePixelRatio || 1;
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	ctx.resetTransform();
	ctx.scale(dpr, dpr);
}

// ─── Interaction ──────────────────────────────────────────────────────────────

let ghostPos = $state(null);

function handleClick(e) {
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	if (interactionMode === "obstacle") {
		const removed = simulation.removeObstacleNear(x, y, 20);
		if (!removed) simulation.addObstacle(x, y, Number(params.obstacleRadius));
	} else if (interactionMode === "target") {
		if (simulation.target) {
			const dx = simulation.target.x - x;
			const dy = simulation.target.y - y;
			if (Math.sqrt(dx * dx + dy * dy) < 30) {
				simulation.clearTarget();
			} else {
				simulation.setTarget(x, y);
			}
		} else {
			simulation.setTarget(x, y);
		}
	}
}

function handleMouseMove(e) {
	if (interactionMode === "select") { ghostPos = null; return; }
	const rect = canvas.getBoundingClientRect();
	ghostPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function handleMouseLeave() { ghostPos = null; }

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function drawGrid() {
	ctx.strokeStyle = C.grid;
	ctx.lineWidth = 1;
	const step = 60;
	for (let x = 0; x < width; x += step) {
		ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
	}
	for (let y = 0; y < height; y += step) {
		ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
	}
}

function drawEdgeMargin() {
	if (params.torusMode) return;
	const m = 40;
	ctx.fillStyle = C.edgeMargin;
	ctx.fillRect(0, 0, m, height);
	ctx.fillRect(width - m, 0, m, height);
	ctx.fillRect(m, 0, width - 2 * m, m);
	ctx.fillRect(m, height - m, width - 2 * m, m);
	ctx.strokeStyle = C.edgeBorder;
	ctx.lineWidth = 1;
	ctx.setLineDash([6, 4]);
	ctx.strokeRect(m, m, width - 2 * m, height - 2 * m);
	ctx.setLineDash([]);
}

function drawObstacles() {
	for (const obs of simulation.obstacles) {
		const { x, y } = obs.position;
		const r = obs.radius;
		// Avoidance halo
		ctx.beginPath();
		ctx.arc(x, y, r + 6, 0, Math.PI * 2);
		ctx.fillStyle = C.obstacleHalo;
		ctx.fill();
		// Body
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fillStyle = C.obstacle;
		ctx.strokeStyle = C.obstacleBorder;
		ctx.lineWidth = 2;
		ctx.fill();
		ctx.stroke();
		// Radius label
		ctx.fillStyle = "#94a3b8";
		ctx.font = `bold 10px 'JetBrains Mono', monospace`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(`r${r}`, x, y);
	}
}

function drawTarget() {
	if (!simulation.target) return;
	const { x, y } = simulation.target;
	const t = Date.now() / 1000;
	const pulse = 0.7 + 0.3 * Math.sin(t * 3);
	ctx.beginPath();
	ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2);
	ctx.fillStyle = C.targetRing;
	ctx.fill();
	ctx.beginPath();
	ctx.arc(x, y, 8, 0, Math.PI * 2);
	ctx.fillStyle = C.target;
	ctx.strokeStyle = "#ca8a04";
	ctx.lineWidth = 2;
	ctx.fill(); ctx.stroke();
	ctx.fillStyle = "#92400e";
	ctx.font = `bold 9px Inter, sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.fillText("TARGET", x, y + 12);
}

function drawDetectionBox() {
	const agent = simulation.agent;
	if (!agent || !agent.debugAvoidance) return;
	const { boxCorners, closestObs } = agent.debugAvoidance;
	if (!boxCorners) return;

	const active = closestObs !== null;
	ctx.beginPath();
	ctx.moveTo(boxCorners[3].x, boxCorners[3].y);
	ctx.lineTo(boxCorners[0].x, boxCorners[0].y);
	ctx.lineTo(boxCorners[1].x, boxCorners[1].y);
	ctx.lineTo(boxCorners[2].x, boxCorners[2].y);
	ctx.closePath();
	ctx.fillStyle = active ? C.boxActive : C.boxNormal;
	ctx.strokeStyle = active ? C.boxActiveBorder : C.boxBorder;
	ctx.lineWidth = 1.5;
	ctx.fill();
	ctx.stroke();
}

function drawLocalAxes() {
	const agent = simulation.agent;
	if (!agent || !agent.debugAvoidance) return;
	const { heading, side } = agent.debugAvoidance;
	if (!heading) return;
	const { x, y } = agent.position;
	const axisLen = 50;

	// Heading axis (+X local = forward)
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + heading.x * axisLen, y + heading.y * axisLen);
	ctx.strokeStyle = C.headingAxis;
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.fillStyle = C.headingAxis;
	ctx.font = "bold 10px Inter";
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	ctx.fillText("+X (fwd)", x + heading.x * axisLen + 4, y + heading.y * axisLen);

	// Side axis (+Y local = lateral)
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + side.x * axisLen, y + side.y * axisLen);
	ctx.strokeStyle = C.sideAxis;
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.fillStyle = C.sideAxis;
	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";
	ctx.fillText("+Y (side)", x + side.x * axisLen, y + side.y * axisLen - 4);
}

function drawForceVectors() {
	const agent = simulation.agent;
	if (!agent || !agent.debugAvoidance) return;
	const { worldForce, localForce } = agent.debugAvoidance;
	if (!worldForce || !localForce) return;
	const { x, y } = agent.position;
	const scale2 = 0.6;

	// World-space resultant
	drawArrow(x, y, x + worldForce.x * scale2, y + worldForce.y * scale2, C.worldForce, 2.5, "Avoid");

	// Decomposition (approximate directions)
	const { heading, side } = agent.debugAvoidance;
	if (heading && side) {
		const brakingVec = { x: localForce.x * heading.x + 0 * side.x, y: localForce.x * heading.y + 0 * side.y };
		const lateralVec = { x: localForce.y * side.x, y: localForce.y * side.y };
		drawArrow(x, y, x + brakingVec.x * scale2, y + brakingVec.y * scale2, C.brakingForce, 1.5, "Brake");
		drawArrow(x, y, x + lateralVec.x * scale2, y + lateralVec.y * scale2, C.lateralForce, 1.5, "Lateral");
	}
}

function drawArrow(x1, y1, x2, y2, color, width2, label) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = color;
	ctx.lineWidth = width2;
	ctx.stroke();
	const dx = x2 - x1; const dy = y2 - y1;
	const len = Math.sqrt(dx * dx + dy * dy);
	if (len < 4) return;
	const ux = dx / len; const uy = dy / len;
	const sz = 8;
	ctx.beginPath();
	ctx.moveTo(x2, y2);
	ctx.lineTo(x2 - sz * ux + sz * 0.4 * uy, y2 - sz * uy - sz * 0.4 * ux);
	ctx.lineTo(x2 - sz * ux - sz * 0.4 * uy, y2 - sz * uy + sz * 0.4 * ux);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
	if (label) {
		ctx.fillStyle = color;
		ctx.font = "bold 10px Inter";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		ctx.fillText(label, x2, y2 - 10);
	}
}

function drawTrail() {
	const agent = simulation.agent;
	if (!agent || agent.trail.length < 2) return;
	ctx.beginPath();
	ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
	for (let i = 1; i < agent.trail.length; i++) {
		ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
	}
	ctx.strokeStyle = C.trail;
	ctx.lineWidth = 1.5;
	ctx.stroke();
}

function drawAgent() {
	const agent = simulation.agent;
	if (!agent) return;
	const { x, y } = agent.position;
	const spd = magnitude(agent.velocity);
	const ang = spd > 0.5 ? Math.atan2(agent.velocity.y, agent.velocity.x) : 0;
	const r = agent.boundingRadius;

	// Glow
	ctx.beginPath();
	ctx.arc(x, y, r + 6, 0, Math.PI * 2);
	ctx.fillStyle = C.agentGlow;
	ctx.fill();

	// Body (triangle facing heading)
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(ang);
	ctx.beginPath();
	ctx.moveTo(r, 0);
	ctx.lineTo(-r, r * 0.6);
	ctx.lineTo(-r * 0.5, 0);
	ctx.lineTo(-r, -r * 0.6);
	ctx.closePath();
	ctx.fillStyle = C.agentFill;
	ctx.strokeStyle = C.agentBorder;
	ctx.lineWidth = 2;
	ctx.fill();
	ctx.stroke();
	ctx.restore();

	// Velocity vector
	if (spd > 1) {
		const scale2 = 0.4;
		drawArrow(x, y, x + agent.velocity.x * scale2, y + agent.velocity.y * scale2, C.velocity, 2, null);
	}
}

function drawGhost() {
	if (!ghostPos) return;
	if (interactionMode === "obstacle") {
		ctx.beginPath();
		ctx.arc(ghostPos.x, ghostPos.y, params.obstacleRadius, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(51,65,85,0.25)";
		ctx.strokeStyle = "rgba(51,65,85,0.5)";
		ctx.lineWidth = 1.5;
		ctx.fill();
		ctx.stroke();
	} else if (interactionMode === "target") {
		ctx.beginPath();
		ctx.arc(ghostPos.x, ghostPos.y, 8, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(253,224,71,0.5)";
		ctx.strokeStyle = "#ca8a04";
		ctx.lineWidth = 1.5;
		ctx.fill();
		ctx.stroke();
	}
}

// ─── Render loop ─────────────────────────────────────────────────────────────

function draw() {
	if (!ctx) return;
	ctx.clearRect(0, 0, width, height);
	drawGrid();
	drawEdgeMargin();
	if (showTrail) drawTrail();
	drawObstacles();
	drawTarget();
	if (showDetectionBox) drawDetectionBox();
	if (showLocalAxes) drawLocalAxes();
	if (showForceVectors) drawForceVectors();
	drawAgent();
	drawGhost();
}

onMount(() => {
	ctx = canvas.getContext("2d");

	let rafId;
	const loop = () => { draw(); rafId = requestAnimationFrame(loop); };
	loop();

	return () => cancelAnimationFrame(rafId);
});

$effect(() => {
	if (containerRef && canvas) {
		const ro = new ResizeObserver(() => handleResize());
		ro.observe(containerRef);
		handleResize();
		return () => ro.disconnect();
	}
});
</script>

<canvas
  bind:this={canvas}
  onclick={handleClick}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  style:cursor={interactionMode === "obstacle" ? "cell" : interactionMode === "target" ? "crosshair" : "default"}
  aria-label="Obstacle avoidance simulation canvas"
></canvas>

<style>
  canvas { display: block; width: 100%; height: 100%; }
</style>

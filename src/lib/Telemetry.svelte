<script>
let { telemetry } = $props();

const phaseLabels = [
	"Clear — no threat detected",
	"Phase 1: Local Transform",
	"Phase 2: Forward Culling",
	"Phase 3: Radius Expansion",
	"Phase 4: Intersection Test",
	"Phase 5: Force Generation",
];

const phaseColors = [
	"#10b981",
	"#3b82f6",
	"#f59e0b",
	"#f97316",
	"#8b5cf6",
	"#ef4444",
];
</script>

<div class="telemetry-panel">
  <div class="telem-header">Live Telemetry</div>

  <div class="telem-grid">
    <div class="telem-item">
      <span class="label">Speed</span>
      <span class="value mono">{telemetry.speed.toFixed(1)} px/s</span>
    </div>
    <div class="telem-item">
      <span class="label">Heading</span>
      <span class="value mono">{telemetry.headingDeg.toFixed(1)}&deg;</span>
    </div>
    <div class="telem-item">
      <span class="label">Box Length</span>
      <span class="value mono">{telemetry.boxLength} px</span>
    </div>
    <div class="telem-item">
      <span class="label">Obstacles</span>
      <span class="value accent">{telemetry.obstacleCount}</span>
    </div>
  </div>

  <div class="telem-header" style="margin-top: 1rem;">Active Algorithm Phase</div>
  <div class="phase-badge" style="background: {phaseColors[telemetry.activePhase]}22; border-color: {phaseColors[telemetry.activePhase]}66; color: {phaseColors[telemetry.activePhase]}">
    {phaseLabels[telemetry.activePhase] ?? phaseLabels[0]}
  </div>

  <div class="telem-header" style="margin-top: 1rem;">Force Breakdown</div>

  <div class="force-breakdown">
    <div class="force-row">
      <span class="force-label brake">Brake</span>
      <div class="force-bar-track">
        <div class="force-bar brake-bar" style="width: {Math.min(100, telemetry.brakingMag * 2)}%"></div>
      </div>
      <span class="force-val brake">{telemetry.brakingMag.toFixed(1)}</span>
    </div>
    <div class="force-row">
      <span class="force-label lat">Lateral</span>
      <div class="force-bar-track">
        <div class="force-bar lat-bar" style="width: {Math.min(100, telemetry.lateralMag * 2)}%"></div>
      </div>
      <span class="force-val lat">{telemetry.lateralMag.toFixed(1)}</span>
    </div>
  </div>
</div>

<style>
  .telemetry-panel {
    background: var(--bg-primary); border: 1px solid var(--panel-border);
    border-radius: 12px; padding: 1.2rem;
  }
  .telem-header {
    font-size: 0.7rem; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 1.5px;
    margin-bottom: 0.8rem; border-bottom: 1px solid var(--panel-border);
    padding-bottom: 0.4rem; font-weight: 700;
  }
  .telem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem 0.6rem; }
  .telem-item { display: flex; flex-direction: column; gap: 0.15rem; }
  .label { font-size: 0.65rem; color: var(--text-secondary); font-weight: 500; }
  .value { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
  .accent { color: var(--accent); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }

  .phase-badge {
    padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid;
    font-size: 0.72rem; font-weight: 700; transition: all 0.2s;
  }

  .force-breakdown { margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .force-row { display: flex; align-items: center; gap: 0.5rem; }
  .force-label { font-size: 0.65rem; font-weight: 800; width: 40px; text-transform: uppercase; }
  .force-label.brake { color: #ef4444; }
  .force-label.lat { color: #8b5cf6; }
  .force-val { font-family: monospace; font-size: 0.65rem; font-weight: 700; width: 36px; text-align: right; }
  .force-val.brake { color: #ef4444; }
  .force-val.lat { color: #8b5cf6; }
  .force-bar-track { flex: 1; height: 6px; background: var(--panel-border); border-radius: 3px; overflow: hidden; }
  .force-bar { height: 100%; border-radius: 3px; transition: width 0.1s linear; }
  .brake-bar { background: #ef4444; }
  .lat-bar { background: #8b5cf6; }
</style>

<script>
let {
	params = $bindable(),
	showTrail = $bindable(),
	showLocalAxes = $bindable(),
	showDetectionBox = $bindable(),
	showForceVectors = $bindable(),
	interactionMode = $bindable(),
	onReset = () => {},
	onGlossary = () => {},
	onClearObstacles = () => {},
	onClearTarget = () => {},
	obstacleCount = 0,
	hasTarget = false,
} = $props();
</script>

<div class="controls-panel">

  <!-- ── Interaction Mode ── -->
  <header class="section-header">
    <h3>Canvas Mode</h3>
    <button class="glossary-btn" onclick={() => onGlossary('interaction')} aria-label="Open glossary for interaction modes">?</button>
  </header>
  <div class="mode-row">
    <button
      class="mode-btn"
      class:mode-active={interactionMode === 'select'}
      onclick={() => interactionMode = 'select'}
      aria-pressed={interactionMode === 'select'}
    >Observe</button>
    <button
      class="mode-btn obstacle-mode"
      class:mode-active={interactionMode === 'obstacle'}
      onclick={() => interactionMode = 'obstacle'}
      aria-pressed={interactionMode === 'obstacle'}
    >Place Obstacle</button>
    <button
      class="mode-btn target-mode"
      class:mode-active={interactionMode === 'target'}
      onclick={() => interactionMode = 'target'}
      aria-pressed={interactionMode === 'target'}
    >Place Target</button>
  </div>

  {#if interactionMode === 'obstacle'}
  <div class="control-group" style="margin-top: 0.4rem;">
    <div class="label-row">
      <label for="obs-radius">Obstacle Radius (px)</label>
      <span>{params.obstacleRadius}</span>
    </div>
    <input id="obs-radius" type="range" min="12" max="80" step="4" bind:value={params.obstacleRadius}>
    <p class="hint">Click canvas to place. Click existing obstacle to remove.</p>
  </div>
  {/if}

  <div class="action-row">
    {#if obstacleCount > 0}
    <button class="clear-btn" onclick={onClearObstacles}>
      Clear {obstacleCount} Obstacle{obstacleCount > 1 ? 's' : ''}
    </button>
    {/if}
    {#if hasTarget}
    <button class="clear-btn target-clear" onclick={onClearTarget}>
      Clear Target
    </button>
    {/if}
  </div>

  <hr />

  <!-- ── Agent Physics ── -->
  <header class="section-header">
    <h3>Agent Physics</h3>
    <button class="glossary-btn" onclick={() => onGlossary('physics')} aria-label="Open glossary for agent physics">?</button>
  </header>

  <div class="control-group">
    <div class="label-row">
      <label for="max-speed">Max Speed (px/s)</label>
      <span>{params.maxSpeed}</span>
    </div>
    <input id="max-speed" type="range" min="30" max="300" step="10" bind:value={params.maxSpeed}>
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="max-force">Max Force (turn rate)</label>
      <span>{params.maxForce}</span>
    </div>
    <input id="max-force" type="range" min="20" max="500" step="10" bind:value={params.maxForce}>
    <p class="hint">Caps steering acceleration — lower = sluggish turns.</p>
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="bounding-r">Bounding Radius (px)</label>
      <span>{params.boundingRadius}</span>
    </div>
    <input id="bounding-r" type="range" min="6" max="40" step="2" bind:value={params.boundingRadius}>
    <p class="hint">Agent body size — inflates obstacle radii during intersection check.</p>
  </div>

  <hr />

  <!-- ── Detection Box ── -->
  <header class="section-header">
    <h3>Detection Box</h3>
    <button class="glossary-btn" onclick={() => onGlossary('box')} aria-label="Open glossary for detection box">?</button>
  </header>

  <div class="control-group">
    <div class="label-row">
      <label for="box-len" class="box-label">Box Length (px)</label>
      <span class="box-val">{params.detectionBoxLength}</span>
    </div>
    <input id="box-len" type="range" min="30" max="300" step="10" bind:value={params.detectionBoxLength} class="box-slider">
    <p class="hint">Lookahead distance. Shorter = reactive; longer = predictive.</p>
  </div>

  <hr />

  <!-- ── Force Tuning ── -->
  <header class="section-header">
    <h3>Avoidance Forces</h3>
    <button class="glossary-btn" onclick={() => onGlossary('forces')} aria-label="Open glossary for avoidance forces">?</button>
  </header>

  <div class="control-group">
    <div class="label-row">
      <label for="braking-w" class="brake-label">Braking Weight</label>
      <span class="brake-val">{params.brakingWeight.toFixed(1)}</span>
    </div>
    <input id="braking-w" type="range" min="0" max="5" step="0.1" bind:value={params.brakingWeight} class="brake-slider">
    <p class="hint">Scales the &minus;X (deceleration) force component.</p>
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="lateral-m" class="lat-label">Lateral Multiplier</label>
      <span class="lat-val">{params.lateralMultiplier.toFixed(1)}</span>
    </div>
    <input id="lateral-m" type="range" min="0" max="6" step="0.1" bind:value={params.lateralMultiplier} class="lat-slider">
    <p class="hint">Scales the ±Y (sideways steering) force component.</p>
  </div>

  <hr />

  <!-- ── Behaviour Weights ── -->
  <header class="section-header">
    <h3>Behaviour Weights</h3>
    <button class="glossary-btn" onclick={() => onGlossary('weights')} aria-label="Open glossary for behaviour weights">?</button>
  </header>

  <div class="control-group">
    <div class="label-row">
      <label for="w-avoid" class="avoid-label">Obstacle Avoidance</label>
      <span class="avoid-val">{params.weightAvoidance.toFixed(1)}</span>
    </div>
    <input id="w-avoid" type="range" min="0" max="10" step="0.5" bind:value={params.weightAvoidance} class="avoid-slider">
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="w-seek">Target Seek</label>
      <span>{params.weightSeek.toFixed(1)}</span>
    </div>
    <input id="w-seek" type="range" min="0" max="6" step="0.1" bind:value={params.weightSeek}>
    <p class="hint">Active only when a target is placed.</p>
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="w-wander">Wander</label>
      <span>{params.weightWander.toFixed(1)}</span>
    </div>
    <input id="w-wander" type="range" min="0" max="3" step="0.1" bind:value={params.weightWander}>
    <p class="hint">Active when no target is placed.</p>
  </div>

  <hr />

  <!-- ── Visuals ── -->
  <header class="section-header">
    <h3>Visualisation</h3>
    <button class="glossary-btn" onclick={() => onGlossary('visuals')} aria-label="Open glossary for visualisation">?</button>
  </header>

  <div class="toggle-row">
    <label class="toggle-label" for="chk-torus">
      <input type="checkbox" id="chk-torus" bind:checked={params.torusMode}>
      Torus Wrapping
    </label>
  </div>
  <div class="toggle-row">
    <label class="toggle-label" for="chk-trail">
      <input type="checkbox" id="chk-trail" bind:checked={showTrail}>
      Show Trail
    </label>
  </div>
  <div class="toggle-row">
    <label class="toggle-label box-toggle" for="chk-box">
      <input type="checkbox" id="chk-box" bind:checked={showDetectionBox}>
      Detection Box
    </label>
  </div>
  <div class="toggle-row">
    <label class="toggle-label axes-toggle" for="chk-axes">
      <input type="checkbox" id="chk-axes" bind:checked={showLocalAxes}>
      Local Axes (X/Y)
    </label>
  </div>
  <div class="toggle-row">
    <label class="toggle-label force-toggle" for="chk-force">
      <input type="checkbox" id="chk-force" bind:checked={showForceVectors}>
      Force Vectors
    </label>
  </div>

  <hr />

  <button class="reset-btn" onclick={onReset}>Reset Agent</button>
</div>

<style>
  .mode-row { display: flex; gap: 0.3rem; flex-wrap: wrap; }
  .mode-btn {
    flex: 1; min-width: 0; padding: 0.45rem 0.3rem; border-radius: 6px;
    border: 1px solid var(--panel-border); background: var(--bg-primary);
    font-size: 0.68rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
    text-align: center;
  }
  .mode-btn:hover { border-color: var(--accent); }
  .mode-btn.mode-active { background: var(--accent); color: white; border-color: var(--accent); }
  .mode-btn.obstacle-mode.mode-active { background: #64748b; border-color: #64748b; }
  .mode-btn.target-mode.mode-active { background: #ca8a04; border-color: #ca8a04; }

  .clear-btn.target-clear { border-color: rgba(202,138,4,0.4); background: rgba(202,138,4,0.08); color: #ca8a04; }
  .clear-btn.target-clear:hover { background: rgba(202,138,4,0.2); }

  .box-label, .box-val { color: #2563eb; }
  .box-slider::-webkit-slider-thumb { background: #2563eb !important; }
  .brake-label, .brake-val { color: #ef4444; }
  .brake-slider::-webkit-slider-thumb { background: #ef4444 !important; }
  .lat-label, .lat-val { color: #8b5cf6; }
  .lat-slider::-webkit-slider-thumb { background: #8b5cf6 !important; }
  .avoid-label, .avoid-val { color: #f97316; }
  .avoid-slider::-webkit-slider-thumb { background: #f97316 !important; }

  .box-toggle { color: #2563eb; }
  .box-toggle input[type="checkbox"] { accent-color: #2563eb; }
  .axes-toggle { color: #10b981; }
  .axes-toggle input[type="checkbox"] { accent-color: #10b981; }
  .force-toggle { color: #8b5cf6; }
  .force-toggle input[type="checkbox"] { accent-color: #8b5cf6; }

  hr { border: 0; border-top: 1px solid var(--panel-border); margin: 0.4rem 0; }
</style>

/* global document, location, window */

import { events, mission, sections, sources } from './data.js'

const main = document.querySelector('#main')
const dialog = document.querySelector('#source-dialog')
const dialogContent = document.querySelector('#source-dialog-content')
let selectedEventIndex = events.findIndex((event) => event.id === 'a11-pdi-ignition')
let demoTimer = null

function evidenceTag(label = 'ACTUAL') {
  return `<span class="evidence evidence-${label.toLowerCase()}">${label}</span>`
}

function sourceButton(sourceId, label = sourceId) {
  return `<button class="source-link" type="button" data-open-source="${sourceId}">${label}</button>`
}

function archiveView() {
  const featuredEvents = events.filter((event) =>
    [
      'a11-liftoff',
      'a11-sic-sii-separation',
      'a11-tli-ignition',
      'a11-loi-ignition',
      'a11-pdi-ignition',
      'a11-touchdown',
      'a11-lunar-liftoff',
      'a11-splashdown',
    ].includes(event.id),
  )

  return `
    <div class="archive-shell">
      <aside class="archive-index" aria-label="Archive chapters">
        <p class="rail-kicker">ARCHIVE CONTENTS</p>
        <ol>
          ${sections.map(([number, title], index) => `<li class="${index === 0 ? 'is-current' : ''}"><button type="button"><span>${number}</span>${title}</button></li>`).join('')}
        </ol>
        <div class="rail-foot">
          <span>RECORD CLASS</span>
          <strong>AS-FLOWN / SOURCE-BOUND</strong>
        </div>
      </aside>

      <article class="archive-document">
        <section class="archive-cover" aria-labelledby="archive-title">
          <div class="folio-meta">
            <span>ARCHIVE FOLIO 00</span>
            <span>MISSION INDEX</span>
            <span>REV / PROTOTYPE</span>
          </div>
          <div class="cover-grid">
            <div class="cover-title-block">
              <p class="eyebrow">UNITED STATES CREWED LUNAR LANDING MISSION</p>
              <h1 id="archive-title">${mission.title}</h1>
              <p class="mission-hardware">${mission.launchVehicle} <i>·</i> ${mission.csm} <i>·</i> ${mission.lm}</p>
              <div class="cover-rule"></div>
              <p class="cover-summary">A verifiable mission record organized around as-flown events, vehicle configuration, historical media, and the documents that support every displayed claim.</p>
            </div>
            <dl class="identity-register">
              <div><dt>MISSION</dt><dd>${mission.mission}</dd></div>
              <div><dt>FLIGHT ARTICLE</dt><dd>${mission.launchVehicle}</dd></div>
              <div><dt>SPACECRAFT</dt><dd>${mission.csm}<br />${mission.lm}</dd></div>
              <div><dt>MISSION PERIOD</dt><dd>${mission.dates}</dd></div>
              <div><dt>RECORD STATUS</dt><dd>${evidenceTag()} AS-FLOWN RECORD</dd></div>
              <div><dt>PRIMARY SOURCE</dt><dd>${sourceButton('NASA-A11-MR')}</dd></div>
            </dl>
          </div>
        </section>

        <section class="archive-section archive-plate-section" aria-labelledby="plate-title">
          <header class="section-heading">
            <div><span>PLATE</span><strong>00-A</strong></div>
            <div><p>HISTORICAL EVIDENCE</p><h2 id="plate-title">Moon receding after the lunar encounter</h2></div>
          </header>
          <figure class="evidence-plate">
            <img src="/assets/raw/NASA-A11-MOON-VIEW.jpg" alt="Apollo 11 photograph of the Moon viewed during the return to Earth" />
            <figcaption>
              <div><span>IMAGE</span><strong>AS11-44-6665</strong></div>
              <div><span>USE</span><strong>TRANSEARTH ARCHIVE PLATE</strong></div>
              <div><span>EVIDENCE</span><strong>${evidenceTag('ACTUAL')} HISTORICAL PHOTOGRAPH</strong></div>
              <div><span>CONSTRAINT</span><strong>NOT AN APPROACH OR LOI VIEW</strong></div>
              ${sourceButton('NASA-A11-MOON-VIEW', 'OPEN SOURCE RECORD →')}
            </figcaption>
          </figure>
        </section>

        <section class="archive-section timeline-section" aria-labelledby="timeline-title">
          <header class="section-heading">
            <div><span>SECTION</span><strong>03</strong></div>
            <div><p>SELECTED EVENT REGISTER</p><h2 id="timeline-title">As-flown timeline</h2></div>
          </header>
          <div class="timeline-table" role="table" aria-label="Selected verified mission events">
            <div class="timeline-row timeline-head" role="row"><span>MET</span><span>EVENT</span><span>STATUS</span><span>SOURCE</span></div>
            ${featuredEvents
              .map(
                (event) => `
              <button class="timeline-row" type="button" role="row" data-open-control="${event.id}">
                <span class="mono" role="cell">${event.met}</span>
                <span role="cell"><b>${event.title}</b><small>${event.phase}</small></span>
                <span role="cell">${evidenceTag(event.evidence)}</span>
                <span class="mono" role="cell">${event.source}</span>
              </button>
            `,
              )
              .join('')}
          </div>
          <p class="table-note">Prototype selection only. Production event records must be supplied by the Phase 2 mission pack, not this display file.</p>
        </section>

        <section class="archive-section source-room-preview" aria-labelledby="source-room-title">
          <header class="section-heading">
            <div><span>SECTION</span><strong>12</strong></div>
            <div><p>METHOD / RIGHTS / LOCATORS</p><h2 id="source-room-title">Source room</h2></div>
          </header>
          <div class="source-cards">
            ${Object.entries(sources)
              .map(
                ([id, source]) => `
              <button type="button" class="source-card" data-open-source="${id}">
                <span>${id}</span><strong>${source.title}</strong><small>${source.detail}</small><i>OPEN RECORD →</i>
              </button>
            `,
              )
              .join('')}
          </div>
        </section>

        <footer class="archive-footer">
          <p>VISUAL DIRECTION PROTOTYPE — NOT A NASA PRODUCT · NO NASA ENDORSEMENT IMPLIED</p>
          <p>Based on redradman/artemis (MIT) · NASA source records retained per manifest</p>
        </footer>
      </article>
    </div>
  `
}

function missionDiagram(event) {
  const vehicleStack = `
    <g class="rocket-stack">
      <path d="M300 80 L286 104 L286 150 L276 164 L276 262 L288 276 L288 390 L276 405 L276 516 L324 516 L324 405 L312 390 L312 276 L324 262 L324 164 L314 150 L314 104 Z" />
      <path class="rocket-detail" d="M286 150H314M276 262H324M288 390H312M276 405H324" />
      <path class="rocket-detail" d="M282 516L273 534M294 516L291 536M306 516L309 536M318 516L327 534" />
    </g>`

  if (event.view === 'launch' || event.view.startsWith('staging')) {
    const splitY = event.view === 'staging-one' ? 405 : event.view === 'staging-two' ? 276 : null
    return `<svg viewBox="0 0 680 600" role="img" aria-labelledby="diagram-title diagram-desc">
      <title id="diagram-title">Saturn V configuration schematic</title><desc id="diagram-desc">A non-scale line drawing showing the launch vehicle stack${splitY ? ' at a staging command' : ''}.</desc>
      <g class="grid-lines"><path d="M40 100H640M40 200H640M40 300H640M40 400H640M40 500H640M100 40V560M200 40V560M300 40V560M400 40V560M500 40V560M600 40V560" /></g>
      ${vehicleStack}
      ${splitY ? `<path class="event-plane" d="M110 ${splitY}H540"/><text x="550" y="${splitY + 5}">EVENT PLANE</text>` : ''}
      <g class="diagram-labels"><path d="M324 126H474"/><text x="488" y="131">SPACECRAFT</text><path d="M324 218H474"/><text x="488" y="223">S-IVB</text><path d="M324 332H474"/><text x="488" y="337">S-II</text><path d="M324 468H474"/><text x="488" y="473">S-IC</text></g>
      <text class="axis-label" x="44" y="578">CONFIGURATION EXPLANATION ONLY</text>
    </svg>`
  }

  if (event.view === 'earth-moon' || event.view === 'lunar-orbit') {
    return `<svg viewBox="0 0 680 600" role="img" aria-labelledby="diagram-title diagram-desc">
      <title id="diagram-title">Earth Moon relationship schematic</title><desc id="diagram-desc">A non-scale orbital relationship diagram. Positions and path are authored.</desc>
      <g class="grid-lines"><path d="M40 100H640M40 200H640M40 300H640M40 400H640M40 500H640M100 40V560M200 40V560M300 40V560M400 40V560M500 40V560M600 40V560" /></g>
      <circle class="earth" cx="142" cy="344" r="78"/><circle class="moon" cx="548" cy="210" r="42"/>
      <path class="trajectory" d="M142 248C188 132 382 96 522 177"/><path class="trajectory ghost" d="M524 180C612 232 606 350 548 390"/>
      <g class="spacecraft" transform="translate(${event.view === 'lunar-orbit' ? 505 : 300} ${event.view === 'lunar-orbit' ? 160 : 120})"><path d="M0 10L18 0L30 10L18 20Z"/><path d="M30 7H53V13H30"/></g>
      <g class="diagram-labels"><text x="78" y="451">EARTH FRAME</text><text x="496" y="276">MOON FRAME</text></g>
      <text class="axis-label" x="44" y="578">TRAJECTORY AND SCALE ARE AUTHORED</text>
    </svg>`
  }

  if (['descent', 'surface', 'lunar-ascent'].includes(event.view)) {
    const y = event.view === 'descent' ? 245 : event.view === 'lunar-ascent' ? 165 : 402
    return `<svg viewBox="0 0 680 600" role="img" aria-labelledby="diagram-title diagram-desc">
      <title id="diagram-title">Lunar landing site frame schematic</title><desc id="diagram-desc">A reconstructed line diagram of Eagle relative to an authored lunar horizon.</desc>
      <g class="grid-lines"><path d="M40 100H640M40 200H640M40 300H640M40 400H640M40 500H640M100 40V560M200 40V560M300 40V560M400 40V560M500 40V560M600 40V560" /></g>
      <path class="lunar-horizon" d="M30 455C92 438 126 464 184 447C252 426 304 464 366 447C438 427 498 468 650 432V568H30Z"/>
      ${event.view === 'descent' ? '<path class="trajectory descent-path" d="M148 108C278 128 398 216 438 350"/><path class="event-plane" d="M438 350V438"/>' : ''}
      <g class="lm" transform="translate(410 ${y})">
        <path d="M0 42L22 12L60 18L78 46L62 72H18Z"/><path d="M18 72L6 112M62 72L78 112M6 112H-8M78 112H92"/>
        <path class="rocket-detail" d="M23 13L38 -6L58 18M22 48H60M40 72V91"/>
      </g>
      ${event.view === 'lunar-ascent' ? '<path class="event-plane" d="M448 260V390"/><text x="462" y="326">ASCENT VIEW — RECONSTRUCTED</text>' : ''}
      <g class="diagram-labels"><path d="M468 378H584"/><text x="490" y="365">EAGLE</text><text x="64" y="514">LANDING SITE FRAME</text></g>
      <text class="axis-label" x="44" y="578">LOCAL FRAME · VEHICLE / TERRAIN NOT TO SCALE</text>
    </svg>`
  }

  return `<svg viewBox="0 0 680 600" role="img" aria-labelledby="diagram-title diagram-desc">
    <title id="diagram-title">Recovery schematic</title><desc id="diagram-desc">A non-scale line diagram of the command module at splashdown.</desc>
    <g class="grid-lines"><path d="M40 100H640M40 200H640M40 300H640M40 400H640M40 500H640M100 40V560M200 40V560M300 40V560M400 40V560M500 40V560M600 40V560" /></g>
    <path class="ocean" d="M30 420C90 388 142 448 206 416C270 384 324 448 392 416C460 384 514 448 650 402V568H30Z"/>
    <path class="capsule" d="M288 398L330 282L372 398Z"/><path class="rocket-detail" d="M302 360H358M292 398H368"/>
    <path class="canopy" d="M244 180Q330 80 416 180Q330 232 244 180Z"/><path class="rocket-detail" d="M244 180L292 360M416 180L368 398M330 130V282"/>
    <text class="axis-label" x="44" y="578">RECOVERY CONFIGURATION EXPLANATION ONLY</text>
  </svg>`
}

function controlView() {
  const event = events[selectedEventIndex]
  const currentSource = sources[event.source]
  return `
    <div class="control-shell" data-event-view="${event.view}">
      <section class="control-status" aria-label="Replay status">
        <div><span>REPLAY STATUS</span><strong id="play-state">PAUSED</strong></div>
        <div class="met-block"><span>REPLAY MET</span><strong>${event.met}</strong><small>MISSION ELAPSED TIME · SOURCE PRESERVED</small></div>
        <div><span>CURRENT PHASE</span><strong>${event.phase}</strong></div>
        <div><span>HISTORICAL AUDIO</span><strong>OFF</strong></div>
      </section>

      <div class="control-workspace">
        <aside class="phase-rail" aria-label="Selected mission phases">
          <div class="panel-label"><span>01</span><strong>EVENT INDEX</strong></div>
          <ol>
            ${events.map((item, index) => `<li class="${index === selectedEventIndex ? 'is-active' : ''}"><button type="button" data-event-index="${index}"><span>${String(index + 1).padStart(2, '0')}</span><b>${item.phase}</b><small>${item.met}</small></button></li>`).join('')}
          </ol>
        </aside>

        <section class="primary-view" aria-labelledby="event-title">
          <header class="view-head">
            <div><span>PRIMARY VIEW / ${event.view.replace('-', ' ').toUpperCase()}</span><strong>REFERENCE FRAME DISPLAY</strong></div>
            <div>${evidenceTag('SCHEMATIC')}<strong> NOT TO SCALE</strong></div>
          </header>
          <div class="diagram-wrap">${missionDiagram(event)}</div>
          <footer class="view-foot">
            <span>CONFIGURATION VIEW</span>
            <span>CAMERA / POSITION / PATH: SCHEMATIC</span>
            <span>EVENT MET: ${event.evidence}</span>
          </footer>
        </section>

        <aside class="event-record" aria-label="Current event record">
          <div class="panel-label"><span>02</span><strong>CURRENT RECORD</strong></div>
          <article>
            <div class="event-sequence">EVENT ${String(selectedEventIndex + 1).padStart(2, '0')} / ${String(events.length).padStart(2, '0')}</div>
            <p class="record-phase">${event.phase}</p>
            <h1 id="event-title">${event.title}</h1>
            <div class="record-met"><span>MET</span><strong>${event.met}</strong></div>
            <div class="record-status">${evidenceTag(event.evidence)} <span>SOURCE VERIFIED</span></div>
            <p class="record-note">${event.note}</p>
          </article>
          <dl class="record-fields">
            <div><dt>EVENT ID</dt><dd>${event.id}</dd></div>
            <div><dt>SOURCE</dt><dd>${sourceButton(event.source)}</dd></div>
            <div><dt>LOCATOR</dt><dd>${event.locator}</dd></div>
            <div><dt>VEHICLE DATA</dt><dd>NOT AVAILABLE IN THIS PROTOTYPE</dd></div>
          </dl>
          <button class="record-source-button" type="button" data-open-source="${event.source}">OPEN SOURCE / METHOD →</button>
          <div class="source-abstract"><span>${currentSource.title}</span><p>${currentSource.detail}</p></div>
        </aside>
      </div>

      <section class="event-strip" aria-label="Event timeline">
        <button class="transport-button" type="button" data-previous-event aria-label="Previous event">←<span>PREVIOUS</span></button>
        <button class="transport-button play-button" type="button" data-demo-play><span class="play-symbol">▶</span><span>DEMO ADVANCE</span></button>
        <div class="timeline-track">
          <div class="track-label"><span>EDITED EVENT SEQUENCE · PROTOTYPE ONLY</span><span>${String(selectedEventIndex + 1).padStart(2, '0')} / ${String(events.length).padStart(2, '0')}</span></div>
          <div class="track-events">
            ${events.map((item, index) => `<button type="button" class="track-event ${index === selectedEventIndex ? 'is-active' : ''}" data-event-index="${index}" aria-label="Open ${item.title} at MET ${item.met}"><i></i><span>${item.met}</span></button>`).join('')}
          </div>
        </div>
        <button class="transport-button" type="button" data-next-event aria-label="Next event"><span>NEXT</span>→</button>
      </section>
    </div>
  `
}

function currentMode() {
  return location.hash.startsWith('#control') ? 'control' : 'archive'
}

function render() {
  stopDemo()
  const mode = currentMode()
  document.body.dataset.mode = mode
  main.innerHTML = mode === 'control' ? controlView() : archiveView()
  document
    .querySelectorAll('[data-mode-link]')
    .forEach((link) => link.classList.toggle('is-active', link.dataset.modeLink === mode))
  bindInteractions()
}

function openSource(sourceId) {
  const source = sources[sourceId]
  if (!source) return
  dialogContent.innerHTML = `
    <p class="dialog-source-id">${sourceId}</p>
    <h2 id="source-dialog-title">${source.title}</h2>
    <p class="dialog-detail">${source.detail}</p>
    <dl>
      <div><dt>LOCAL ARCHIVE</dt><dd>${source.path}</dd></div>
      <div><dt>PROTOTYPE USE</dt><dd>Read-only display reference; production provenance remains governed by the Source Manifest.</dd></div>
      <div><dt>PHASE BOUNDARY</dt><dd>No Fact/Event runtime binding is implemented in this prototype.</dd></div>
    </dl>
  `
  dialog.showModal()
}

function selectEvent(index) {
  selectedEventIndex = (index + events.length) % events.length
  if (currentMode() !== 'control') location.hash = 'control'
  else {
    main.innerHTML = controlView()
    bindInteractions()
  }
}

function startDemo() {
  const button = document.querySelector('[data-demo-play]')
  if (demoTimer) {
    stopDemo()
    if (button) button.innerHTML = '<span class="play-symbol">▶</span><span>DEMO ADVANCE</span>'
    return
  }
  if (button) button.innerHTML = '<span class="play-symbol">Ⅱ</span><span>PAUSE DEMO</span>'
  const stateLabel = document.querySelector('#play-state')
  if (stateLabel) stateLabel.textContent = 'DEMO ADVANCE'
  demoTimer = window.setInterval(() => selectEvent(selectedEventIndex + 1), 2200)
}

function stopDemo() {
  if (demoTimer) window.clearInterval(demoTimer)
  demoTimer = null
}

function bindInteractions() {
  main
    .querySelectorAll('[data-open-source]')
    .forEach((button) =>
      button.addEventListener('click', () => openSource(button.dataset.openSource)),
    )
  main
    .querySelectorAll('[data-event-index]')
    .forEach((button) =>
      button.addEventListener('click', () => selectEvent(Number(button.dataset.eventIndex))),
    )
  main.querySelectorAll('[data-open-control]').forEach((button) =>
    button.addEventListener('click', () => {
      const index = events.findIndex((event) => event.id === button.dataset.openControl)
      selectEvent(index)
    }),
  )
  document
    .querySelector('[data-previous-event]')
    ?.addEventListener('click', () => selectEvent(selectedEventIndex - 1))
  document
    .querySelector('[data-next-event]')
    ?.addEventListener('click', () => selectEvent(selectedEventIndex + 1))
  document.querySelector('[data-demo-play]')?.addEventListener('click', startDemo)
}

document
  .querySelectorAll('.global-header [data-open-source]')
  .forEach((button) =>
    button.addEventListener('click', () => openSource(button.dataset.openSource)),
  )
window.addEventListener('hashchange', render)
window.addEventListener('keydown', (event) => {
  if (currentMode() !== 'control' || ['INPUT', 'BUTTON'].includes(document.activeElement?.tagName))
    return
  if (event.key.toLowerCase() === 'j') selectEvent(selectedEventIndex - 1)
  if (event.key.toLowerCase() === 'l') selectEvent(selectedEventIndex + 1)
  if (event.key.toLowerCase() === 'k') startDemo()
})
render()

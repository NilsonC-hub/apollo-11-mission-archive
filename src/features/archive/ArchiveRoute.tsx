import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { formatMet, isMissingValue } from '../../mission-core/index.ts'
import {
  factsById,
  formatCitation,
  mission,
  missionPack,
  phase4Events,
  sourcesById,
} from '../../app/mission.ts'

const archiveNav = [
  ['index', '00', 'Mission Index'],
  ['timeline', '03', 'As-Flown Timeline'],
  ['architecture', '04', 'Flight Architecture'],
  ['saturn', '05', 'Saturn V / AS-506'],
  ['spacecraft', '06', 'Columbia & Eagle'],
  ['sources', '12', 'Media & Source Room'],
] as const

const phase4Components = new Set([
  's-ic',
  's-ic-s-ii-interstage',
  's-ii',
  's-ii-s-ivb-interstage',
  's-ivb',
  'instrument-unit',
  'spacecraft-lm-adapter',
  'service-module',
  'command-module',
  'lm-ascent-stage',
  'lm-descent-stage',
  'launch-escape-system',
])

function FactValue({ id }: { id: string }) {
  const fact = factsById.get(id)
  if (!fact || isMissingValue(fact)) return <dd>NOT AVAILABLE IN REVIEWED SOURCE</dd>
  return (
    <dd>
      {fact.value}
      <span className={`evidence-tag evidence-${fact.evidence}`}>{fact.evidence}</span>
    </dd>
  )
}

function SourceNote({ eventId }: { eventId: string }) {
  const event = mission.events.find((candidate) => candidate.id === eventId)
  if (!event) return null
  return (
    <details className="source-note">
      <summary>SOURCE</summary>
      {event.citations.map((citation) => (
        <p key={`${citation.sourceId}-${citation.locator ?? citation.pages}`}>
          {formatCitation(citation)}
        </p>
      ))}
    </details>
  )
}

export function Component() {
  const location = useLocation()

  useEffect(() => {
    const id = location.pathname.split('/').at(-1)
    if (id && id !== 'archive') document.getElementById(id)?.scrollIntoView()
  }, [location.pathname])

  const selectedSources = [
    'NASA-A11-MR',
    'NASA-A11-SATV-FE',
    'NASA-MODEL-SATV',
    'NASA-MODEL-SATV-STL',
    'NASA-MODEL-LM',
    'NASA-CSM-NR',
    'NASA-LM-HB',
  ]
    .map((id) => sourcesById.get(id))
    .filter((source) => source !== undefined)

  return (
    <main id="main-content" className="archive-shell" tabIndex={-1}>
      <aside className="archive-index" aria-label="Archive index">
        <p className="rail-kicker">DOCUMENT REGISTER / PHASE 4 RECORD</p>
        <ol>
          {archiveNav.map(([id, number, label]) => (
            <li key={id}>
              <a href={`#${id}`}>
                <span>{number}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
        <div className="rail-status">
          <span>RECORD SCOPE</span>
          <b>LAUNCH → SPACECRAFT EJECTION</b>
          <p>
            Later mission records remain in the audited data pack and are outside this build phase.
          </p>
        </div>
      </aside>

      <article className="archive-document">
        <section id="index" className="archive-hero section-rule">
          <div className="folio-meta">
            <span>AS-FLOWN RECORD</span>
            <span>MISSION / {mission.id.toUpperCase()}</span>
            <span>RELEASE / PHASE 4 DEV</span>
          </div>
          <div className="hero-grid">
            <div>
              <p className="eyebrow">NATIONAL AERONAUTICS AND SPACE ADMINISTRATION</p>
              <h1>
                APOLLO <em>11</em>
              </h1>
              <p className="hero-deck">
                Mission archive and deterministic historical replay of the launch vehicle and
                Earth-departure sequence.
              </p>
              <Link className="archive-cta" to="/control">
                OPEN MISSION CONTROL <span aria-hidden="true">→</span>
              </Link>
            </div>
            <figure className="hero-plate">
              <img
                src="/missions/apollo11/plates/phase3-apollo11-saturn-v.png"
                alt="Processed side view of the NASA-released Saturn V visualization model"
              />
              <figcaption>
                <span>PLATE 05-A</span>
                NASA-RELEASED VISUALIZATION MODEL · SEMANTIC SPLIT RECONSTRUCTED · NOT NASA CAD
              </figcaption>
            </figure>
          </div>
          <dl className="identity-register">
            <div>
              <dt>MISSION</dt>
              <FactValue id="a11-mission-name" />
            </div>
            <div>
              <dt>LAUNCH VEHICLE</dt>
              <FactValue id="a11-launch-vehicle-designation" />
            </div>
            <div>
              <dt>COMMAND / SERVICE</dt>
              <FactValue id="a11-csm-designation" />
            </div>
            <div>
              <dt>LUNAR MODULE</dt>
              <FactValue id="a11-lm-designation" />
            </div>
          </dl>
        </section>

        <section id="timeline" className="archive-section section-rule">
          <header className="section-heading">
            <p>03 / AS-FLOWN TIMELINE</p>
            <h2>EVENTS, NOT ANIMATION CUES</h2>
            <span lang="zh-Hans">实际飞行时间线</span>
          </header>
          <p className="section-intro">
            The register below stops at the Phase 4 boundary. Every displayed MET is an actual
            source record; visual motion in Mission Control is separately marked schematic.
          </p>
          <ol className="event-register">
            {phase4Events.map((event, index) => (
              <li key={event.id}>
                <span className="event-sequence">{String(index + 1).padStart(2, '0')}</span>
                <time dateTime={`PT${event.metSeconds}S`}>{formatMet(event.metSeconds)}</time>
                <div>
                  <h3>{event.label}</h3>
                  <span className={`evidence-tag evidence-${event.evidence}`}>
                    {event.evidence}
                  </span>
                </div>
                <SourceNote eventId={event.id} />
              </li>
            ))}
          </ol>
        </section>

        <section id="architecture" className="archive-section section-rule">
          <header className="section-heading">
            <p>04 / FLIGHT ARCHITECTURE</p>
            <h2>EARTH DEPARTURE, IN FOUR CONFIGURATIONS</h2>
            <span lang="zh-Hans">飞行架构</span>
          </header>
          <div className="architecture-strip">
            {[
              ['01', 'FULL STACK', 'S-IC powered ascent'],
              ['02', 'UPPER STAGES', 'S-II to S-IVB insertion'],
              ['03', 'PARKING ORBIT', 'S-IVB first cutoff'],
              ['04', 'DOCKED STACK', 'CSM / LM extraction'],
            ].map(([number, title, note]) => (
              <div key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{note}</p>
              </div>
            ))}
          </div>
          <p className="method-callout">
            Configuration drawings and relative motion are schematic and not to scale. Separation
            state changes occur only at the actual event METs above.
          </p>
        </section>

        <section id="saturn" className="archive-section section-rule">
          <header className="section-heading">
            <p>05 / SATURN V · AS-506</p>
            <h2>LAUNCH VEHICLE DOSSIER</h2>
            <span lang="zh-Hans">土星五号与 AS-506</span>
          </header>
          <div className="dossier-grid">
            <figure className="evidence-plate">
              <img
                src="/missions/apollo11/plates/phase3-apollo11-saturn-v.png"
                alt="Saturn V model processing plate with component bands"
              />
              <figcaption>
                <span>MODEL RECORD / SATURN V</span>
                Geometry from a NASA-released visualization model. Stage boundaries are a documented
                editorial reconstruction for replay control.
              </figcaption>
            </figure>
            <div className="component-ledger">
              {mission.vehicle.components
                .filter((component) => phase4Components.has(component.id))
                .filter(
                  (component) =>
                    component.id.startsWith('s-') || component.id === 'instrument-unit',
                )
                .map((component) => (
                  <div key={component.id}>
                    <span>{component.id.toUpperCase()}</span>
                    <b>{component.label}</b>
                    <small>{component.evidence} geometry identity</small>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section id="spacecraft" className="archive-section section-rule">
          <header className="section-heading">
            <p>06 / COLUMBIA &amp; EAGLE</p>
            <h2>SPACECRAFT TRUTH BOUNDARIES</h2>
            <span lang="zh-Hans">哥伦比亚与鹰号</span>
          </header>
          <div className="spacecraft-plates">
            <figure className="evidence-plate">
              <img
                src="/missions/apollo11/plates/phase3-apollo11-command-service-module.png"
                alt="Processed command and service module reconstruction"
              />
              <figcaption>
                <span>COLUMBIA / CSM-107</span>
                RECONSTRUCTED FROM NASA REFERENCES · ASSEMBLED FROM NASA PRINT-KIT STLs · NOT NASA
                CAD OR A CERTIFIED DIGITAL TWIN
              </figcaption>
            </figure>
            <figure className="evidence-plate">
              <img
                src="/missions/apollo11/plates/phase3-apollo11-lunar-module.png"
                alt="Processed NASA-released generic Apollo lunar module model"
              />
              <figcaption>
                <span>EAGLE / LM-5 IDENTITY</span>
                NASA-RELEASED GENERIC APOLLO LM VISUALIZATION · NOT CERTIFIED LM-5 GEOMETRY · STAGE
                SPLIT RECONSTRUCTED
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="sources" className="archive-section section-rule source-room">
          <header className="section-heading">
            <p>12 / SOURCE ROOM</p>
            <h2>PRIMARY RECORDS &amp; MODEL PROVENANCE</h2>
            <span lang="zh-Hans">媒体与来源室</span>
          </header>
          <div className="source-table" role="table" aria-label="Phase 4 source register">
            {selectedSources.map((source) => (
              <div role="row" key={source.id}>
                <span role="cell">{source.id}</span>
                <div role="cell">
                  <b>{source.title}</b>
                  <small>{source.publisher}</small>
                </div>
                <span role="cell">{source.kind.toUpperCase()}</span>
                <a role="cell" href={source.originalUrl} target="_blank" rel="noreferrer">
                  SOURCE ↗
                </a>
              </div>
            ))}
          </div>
          <footer className="archive-footer">
            <p>{missionPack.definition.meta.description}</p>
            <p>NUMERIC CLAIMS REQUIRE A LOCATABLE NASA SOURCE OR AN EXPLICIT SCHEMATIC LABEL.</p>
          </footer>
        </section>
      </article>
    </main>
  )
}

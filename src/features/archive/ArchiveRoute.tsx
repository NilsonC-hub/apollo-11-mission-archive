import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { formatMet, isMissingValue } from '../../mission-core/index.ts'
import {
  factsById,
  formatCitation,
  getEvent,
  mission,
  missionPack,
  replayEvents,
} from '../../app/mission.ts'
import { publicAssetUrl } from '../../app/deploymentPath.ts'
import {
  getDocumentPlateRecord,
  getHistoricalImageRecord,
} from '../../missions/apollo11/archiveMedia.ts'
import assetManifestJson from '../../missions/apollo11/asset-manifest.json' with { type: 'json' }
import { DocumentPlate, EvidencePair, EvidencePlate } from './ArchiveMedia.tsx'
import './archiveMedia.css'

const archiveNav = [
  ['index', '00', 'Mission Index'],
  ['objectives', '01', 'Mission Objectives'],
  ['crew', '02', 'Crew & Flight Roles'],
  ['timeline', '03', 'As-Flown Timeline'],
  ['architecture', '04', 'Flight Architecture'],
  ['saturn', '05', 'Saturn V / AS-506'],
  ['spacecraft', '06', 'Columbia & Eagle'],
  ['guidance', '07', 'Guidance & Computing'],
  ['control-records', '08', 'Mission Control Record'],
  ['landing', '09', 'Powered Descent'],
  ['surface', '10', 'Surface Operations'],
  ['return', '11', 'Return & Recovery'],
  ['sources', '12', 'Media & Source Room'],
] as const

const chaptersById = new Map(missionPack.archive.chapters.map((chapter) => [chapter.id, chapter]))

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

const padContextImage = getHistoricalImageRecord('a11-s69-38660')
const groundLaunchImage = getHistoricalImageRecord('a11-s69-39525')
const towerCameraImage = getHistoricalImageRecord('a11-s69-39961')
const saturnMissionReportPlate = getDocumentPlateRecord('a11-mission-report-p334-a10')

interface ModelAssetRecord {
  assetId: string
  sourceIds: string[]
  truthLabel: string
  nodeManifest: string
  thumbnail: string
  lods: { medium: { path: string } }
}

const saturnAssetCandidate = assetManifestJson.assets.find(
  (asset) => asset.assetId === 'apollo11-saturn-v',
) as Partial<ModelAssetRecord> | undefined
if (
  !saturnAssetCandidate ||
  !Array.isArray(saturnAssetCandidate.sourceIds) ||
  typeof saturnAssetCandidate.truthLabel !== 'string' ||
  typeof saturnAssetCandidate.nodeManifest !== 'string' ||
  typeof saturnAssetCandidate.thumbnail !== 'string' ||
  typeof saturnAssetCandidate.lods?.medium?.path !== 'string'
) {
  throw new TypeError('Saturn V asset manifest record is missing')
}
const saturnAsset = saturnAssetCandidate as ModelAssetRecord
const saturnThumbnail = publicAssetUrl(
  `/missions/apollo11/plates/${saturnAsset.thumbnail.split('/').at(-1)}`,
)
const saturnModelSources = saturnAsset.sourceIds.map((sourceId) => {
  const source = mission.sources.sources.find((candidate) => candidate.id === sourceId)
  if (!source) throw new TypeError(`Saturn V model source is missing: ${sourceId}`)
  return source
})

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

function ChapterSources({ chapterId }: { chapterId: string }) {
  const chapter = chaptersById.get(chapterId)
  if (!chapter) return null
  return (
    <details className="chapter-sources">
      <summary>CHAPTER SOURCES</summary>
      {chapter.citations.map((citation) => (
        <p key={`${citation.sourceId}-${formatCitation(citation)}`}>{formatCitation(citation)}</p>
      ))}
    </details>
  )
}

export function Component() {
  const location = useLocation()

  useEffect(() => {
    const pathId = location.pathname.split('/').at(-1)
    let id = pathId
    if (location.hash) {
      try {
        id = decodeURIComponent(location.hash.slice(1))
      } catch {
        id = location.hash.slice(1)
      }
    }
    if (id && id !== 'archive') {
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    }
  }, [location.hash, location.pathname])

  const selectedSources = mission.sources.sources

  return (
    <main id="main-content" className="archive-shell" tabIndex={-1}>
      <aside className="archive-index" aria-label="Archive index">
        <p className="rail-kicker">DOCUMENT REGISTER / PHASE 6 RECORD</p>
        <ol>
          {archiveNav.map(([id, number, label]) => (
            <li key={id}>
              <Link to={`/archive/${id}`}>
                <span>{number}</span>
                {label}
              </Link>
            </li>
          ))}
        </ol>
        <div className="rail-status">
          <span>RECORD SCOPE</span>
          <b>LAUNCH → SPLASHDOWN</b>
          <p>Complete document register with source-bound replay and explicit truth labels.</p>
        </div>
      </aside>

      <article className="archive-document">
        <section id="index" className="archive-hero section-rule">
          <div className="folio-meta">
            <span>AS-FLOWN RECORD</span>
            <span>MISSION / {mission.id.toUpperCase()}</span>
            <span>STATUS / PHASE 6 COMPLETE</span>
          </div>
          <div className="hero-grid">
            <div>
              <p className="eyebrow">NATIONAL AERONAUTICS AND SPACE ADMINISTRATION</p>
              <h1>
                APOLLO <em>11</em>
              </h1>
              <p className="hero-deck">
                Mission archive and deterministic historical replay from Saturn V launch through
                lunar operations, Earth return, and splashdown.
              </p>
              <Link className="archive-cta" to="/control">
                OPEN MISSION CONTROL <span aria-hidden="true">→</span>
              </Link>
            </div>
            <EvidencePlate
              label="MISSION INDEX / PAD CONTEXT"
              record={padContextImage}
              priority
              sizes="(max-width: 900px) calc(100vw - 36px), (max-width: 1100px) calc(100vw - 168px), 44vw"
              variant="hero"
            />
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

        <section id="objectives" className="archive-section section-rule">
          <header className="section-heading">
            <p>01 / MISSION OBJECTIVES</p>
            <h2>INTENT AND AS-FLOWN OUTCOME</h2>
            <span lang="zh-Hans">任务目标</span>
          </header>
          <div className="objective-register">
            <article>
              <span className="record-class record-planned">PLANNED MISSION OBJECTIVE</span>
              <h3>CREWED LUNAR LANDING AND RETURN TO EARTH</h3>
              <p>
                The objective is presented as mission intent, not as proof of outcome and not as an
                animation cue.
              </p>
            </article>
            <article>
              <span className="record-class record-actual">AS-FLOWN EVENT ANCHORS</span>
              <div className="objective-events">
                {['a11-touchdown', 'a11-splashdown'].map((eventId) => {
                  const event = getEvent(eventId)
                  return (
                    <div key={event.id}>
                      <time>{formatMet(event.metSeconds)}</time>
                      <b>{event.label}</b>
                    </div>
                  )
                })}
              </div>
              <p>Outcome is established only through the cited ACTUAL event record.</p>
            </article>
          </div>
          <ChapterSources chapterId="01" />
        </section>

        <section id="crew" className="archive-section section-rule">
          <header className="section-heading">
            <p>02 / CREW &amp; FLIGHT ROLES</p>
            <h2>DISTINCT FLIGHT STATIONS, ONE MISSION</h2>
            <span lang="zh-Hans">乘组与飞行职责</span>
          </header>
          <div className="crew-register">
            {[
              ['CDR', 'NEIL ARMSTRONG', 'EAGLE · LANDING AND SURFACE OPERATIONS'],
              ['LMP', 'EDWIN E. “BUZZ” ALDRIN JR.', 'EAGLE · LM AND SURFACE OPERATIONS'],
              ['CMP', 'MICHAEL COLLINS', 'COLUMBIA · COMMAND MODULE PILOT'],
            ].map(([role, name, station]) => (
              <article key={role}>
                <span>{role}</span>
                <h3>{name}</h3>
                <p>{station}</p>
              </article>
            ))}
          </div>
          <p className="method-callout">
            Crew roles describe responsibility and vehicle station. They do not imply continuous
            crew-location telemetry between verified configuration events.
          </p>
          <ChapterSources chapterId="02" />
        </section>

        <section id="timeline" className="archive-section section-rule">
          <header className="section-heading">
            <p>03 / AS-FLOWN TIMELINE</p>
            <h2>EVENTS, NOT ANIMATION CUES</h2>
            <span lang="zh-Hans">实际飞行时间线</span>
          </header>
          <p className="section-intro">
            Every displayed MET below is an actual source record. Visual position, scale, path, and
            motion in Mission Control are separately marked schematic.
          </p>
          <ol className="event-register">
            {replayEvents.map((event, index) => (
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
            <h2>MISSION, IN EIGHT CONTROL CONFIGURATIONS</h2>
            <span lang="zh-Hans">飞行架构</span>
          </header>
          <div className="architecture-strip">
            {[
              ['01', 'FULL STACK', 'Saturn V powered ascent'],
              ['02', 'EARTH / TLI', 'Parking orbit and extraction'],
              ['03', 'TRANSLUNAR', 'Docked CSM / LM outbound'],
              ['04', 'LUNAR ORBIT', 'Arrival and orbit operations'],
              ['05', 'DESCENT', 'Separated Eagle descent'],
              ['06', 'SURFACE', 'Tranquility Base configuration'],
              ['07', 'RENDEZVOUS', 'Ascent stage and Columbia'],
              ['08', 'RETURN', 'CSM, entry CM, and recovery'],
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
          <span id="saturn-v" className="archive-anchor-alias" aria-hidden="true" />
          <header className="section-heading">
            <p>05 / SATURN V · AS-506</p>
            <h2>LAUNCH VEHICLE DOSSIER</h2>
            <span lang="zh-Hans">土星五号与 AS-506</span>
          </header>
          <div className="archive-media-lead">
            <p>
              The historical record and the reconstructed model serve different jobs. Photographs
              establish pad and launch context; the model provides a manipulable structural view
              with its reconstruction boundary kept visible.
            </p>
            <Link className="archive-inspector-link" to="/control/inspect/saturn-v">
              OPEN SATURN V INSPECTOR <span aria-hidden="true">→</span>
            </Link>
          </div>

          <EvidencePair ariaLabel="Launch-tower photograph and Saturn V model evidence">
            <EvidencePlate
              label="TOWER-CAMERA PERSPECTIVE"
              record={towerCameraImage}
              sizes="(max-width: 900px) calc(100vw - 36px), 40vw"
            />
            <div className="archive-model-stack">
              <figure className="archive-evidence-plate archive-model-plate">
                <div className="archive-evidence-visual">
                  <img
                    src={saturnThumbnail}
                    alt="Processed side view of the NASA-released Saturn V visualization model"
                    width="900"
                    height="1200"
                    decoding="async"
                    loading="lazy"
                  />
                </div>
                <figcaption>
                  <div className="archive-evidence-heading">
                    <span>MODEL RECORD / SATURN V</span>
                    <b>{saturnAsset.truthLabel}</b>
                  </div>
                  <p>
                    SOURCES / {saturnAsset.sourceIds.join(' · ')} · NODE RECORD /{' '}
                    {saturnAsset.nodeManifest}
                  </p>
                  <details className="archive-record-details">
                    <summary>
                      MODEL RECORD <span aria-hidden="true">+</span>
                    </summary>
                    <div className="archive-record-body">
                      <dl>
                        <div>
                          <dt>SOURCE ID</dt>
                          <dd>{saturnAsset.sourceIds.join(' · ')}</dd>
                        </div>
                        <div>
                          <dt>TRUTH LABEL</dt>
                          <dd>{saturnAsset.truthLabel}</dd>
                        </div>
                        <div>
                          <dt>NODE MANIFEST</dt>
                          <dd>
                            <code>{saturnAsset.nodeManifest}</code>
                          </dd>
                        </div>
                        <div>
                          <dt>PROCESSING RECIPE</dt>
                          <dd>
                            <code>{assetManifestJson.toolchain.models.recipe}</code>
                          </dd>
                        </div>
                        <div>
                          <dt>RUNTIME RECORD</dt>
                          <dd>
                            <code>{saturnAsset.lods.medium.path}</code>
                          </dd>
                        </div>
                      </dl>
                      <p>
                        The interactive inspector exposes orbit, zoom, alternate viewpoints, and
                        stage focus without claiming certified engineering geometry.
                      </p>
                      <div className="archive-record-links">
                        {saturnModelSources.map((source) => (
                          <a
                            key={source.id}
                            href={source.originalUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {source.id} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  </details>
                </figcaption>
              </figure>
              <div className="component-ledger saturn-component-ledger">
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
                      <small>source-bound component identity · reconstructed model geometry</small>
                    </div>
                  ))}
              </div>
            </div>
          </EvidencePair>

          <EvidencePair
            ariaLabel="Ground launch photograph and Apollo 11 Mission Report document evidence"
            className="archive-evidence-pair--secondary"
          >
            <EvidencePlate
              label="GROUND LAUNCH PERSPECTIVE"
              record={groundLaunchImage}
              sizes="(max-width: 900px) calc(100vw - 36px), 31vw"
            />
            <DocumentPlate
              label="MISSION REPORT / VEHICLE CONFIGURATION"
              record={saturnMissionReportPlate}
              sizes="(max-width: 900px) calc(100vw - 36px), 44vw"
            />
          </EvidencePair>
          <ChapterSources chapterId="05" />
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
                src={publicAssetUrl(
                  '/missions/apollo11/plates/phase3-apollo11-command-service-module.png',
                )}
                alt="Processed command and service module reconstruction"
                decoding="async"
                loading="lazy"
              />
              <figcaption>
                <span>COLUMBIA / CSM-107</span>
                RECONSTRUCTED FROM NASA REFERENCES · ASSEMBLED FROM NASA PRINT-KIT STLs · NOT NASA
                CAD OR A CERTIFIED DIGITAL TWIN
              </figcaption>
            </figure>
            <figure className="evidence-plate">
              <img
                src={publicAssetUrl('/missions/apollo11/plates/phase3-apollo11-lunar-module.png')}
                alt="Processed NASA-released generic Apollo lunar module model"
                decoding="async"
                loading="lazy"
              />
              <figcaption>
                <span>EAGLE / LM-5 IDENTITY</span>
                NASA-RELEASED GENERIC APOLLO LM VISUALIZATION · NOT CERTIFIED LM-5 GEOMETRY · STAGE
                SPLIT RECONSTRUCTED
              </figcaption>
            </figure>
          </div>
          <div className="component-dossier" aria-label="Spacecraft component dossier">
            {mission.vehicle.components
              .filter((component) =>
                [
                  'command-module',
                  'service-module',
                  'lm-ascent-stage',
                  'lm-descent-stage',
                ].includes(component.id),
              )
              .map((component) => (
                <article key={component.id}>
                  <span>{component.id.toUpperCase()}</span>
                  <h3>{component.label}</h3>
                  <b className={`evidence-tag evidence-${component.evidence}`}>
                    {component.evidence}
                  </b>
                  <p>{component.method}</p>
                  <small>SOURCES / {component.sourceIds?.join(' · ')}</small>
                </article>
              ))}
          </div>
          <ChapterSources chapterId="06" />
        </section>

        <section id="guidance" className="archive-section section-rule">
          <header className="section-heading">
            <p>07 / GUIDANCE &amp; COMPUTING</p>
            <h2>SYSTEM BOUNDARIES, NOT AN AGC EMULATOR</h2>
            <span lang="zh-Hans">制导与计算</span>
          </header>
          <div className="guidance-register">
            <article>
              <span>LAUNCH VEHICLE</span>
              <h3>INSTRUMENT UNIT</h3>
              <p>Launch-vehicle guidance identity is linked to the Saturn V source record.</p>
            </article>
            <article>
              <span>COMMAND MODULE</span>
              <h3>COLUMBIA GUIDANCE CONTEXT</h3>
              <p>
                Mission configuration and cited events are shown; computer state is not emulated.
              </p>
            </article>
            <article>
              <span>LUNAR MODULE</span>
              <h3>EAGLE GUIDANCE CONTEXT</h3>
              <p>
                Descent and rendezvous anchors remain distinct from missing continuous telemetry.
              </p>
            </article>
          </div>
          <div className="pending-records">
            <header>
              <span>ALARM RECORD STATUS</span>
              <b>PRECISE MET NOT VERIFIED</b>
            </header>
            {missionPack.unavailable.preciseEvents
              .filter((event) => event.id.startsWith('a11-agc-'))
              .map((event) => (
                <article key={event.id}>
                  <h3>{event.label}</h3>
                  <span>ARCHIVE-ONLY · NO PRECISE ANIMATION</span>
                  <p>{event.note}</p>
                </article>
              ))}
          </div>
          <ChapterSources chapterId="07" />
        </section>

        <section id="control-records" className="archive-section section-rule">
          <header className="section-heading">
            <p>08 / MISSION CONTROL RECORD</p>
            <h2>VOICE TRANSCRIPT, WITHOUT SIMULATED AUDIO</h2>
            <span lang="zh-Hans">任务控制记录</span>
          </header>
          <p className="section-intro">
            The exact transcript records are exposed as text and MET-linked replay points. Audio
            remains unavailable because no verified local audio bytes, channel alignment, or clip
            boundaries exist in the audited pack.
          </p>
          <div className="archive-transcripts">
            {missionPack.media.transcripts.map((record) => (
              <article id={record.id} key={record.id}>
                <div>
                  <time>{formatMet(record.metSeconds)}</time>
                  <span>{record.speaker}</span>
                </div>
                <blockquote>{record.text}</blockquote>
                <p>{formatCitation(record.citation)}</p>
              </article>
            ))}
          </div>
          <ChapterSources chapterId="08" />
        </section>

        <section id="landing" className="archive-section section-rule">
          <header className="section-heading">
            <p>09 / POWERED DESCENT &amp; LANDING</p>
            <h2>EAGLE: ORBIT TO CONTACT</h2>
            <span lang="zh-Hans">动力下降与着陆</span>
          </header>
          <div className="mission-moment-grid">
            {['a11-undocking', 'a11-doi-ignition', 'a11-pdi-ignition', 'a11-touchdown'].map(
              (eventId) => {
                const event = getEvent(eventId)
                return (
                  <article key={event.id}>
                    <time>{formatMet(event.metSeconds)}</time>
                    <h3>{event.label}</h3>
                    <SourceNote eventId={event.id} />
                  </article>
                )
              },
            )}
          </div>
          <div className="landing-reading">
            <span>ESTIMATED LANDING VERTICAL SPEED — DOWN</span>
            <b>
              {mission.telemetry[0]?.samples[0]?.reading.kind === 'value'
                ? `${mission.telemetry[0].samples[0].reading.value} M/S`
                : 'NOT AVAILABLE'}
            </b>
            <p>
              ACTUAL SOURCE VALUE · NORMALIZED FROM 1 FT/S TO SI. No descent profile is inferred
              around this single source sample.
            </p>
          </div>
          <ChapterSources chapterId="09" />
        </section>

        <section id="surface" className="archive-section section-rule">
          <header className="section-heading">
            <p>10 / LUNAR SURFACE OPERATIONS</p>
            <h2>TRANQUILITY BASE: CONFIGURATION RECORD</h2>
            <span lang="zh-Hans">月面作业</span>
          </header>
          <div className="surface-register">
            <div>
              <span>TOUCHDOWN</span>
              <b>{formatMet(getEvent('a11-touchdown').metSeconds)}</b>
              <p>Descent stage lifecycle changes to LANDED.</p>
            </div>
            <div>
              <span>FIRST-STEP TRANSCRIPT</span>
              <b>{formatMet(missionPack.media.transcripts[2].metSeconds)}</b>
              <p>Exact text record; no synthesized voice or continuous surface telemetry.</p>
            </div>
            <div>
              <span>LUNAR LIFTOFF</span>
              <b>{formatMet(getEvent('a11-lunar-liftoff').metSeconds)}</b>
              <p>Ascent stage becomes free; descent stage remains on the surface.</p>
            </div>
          </div>
          <p className="method-callout">
            The Mission Control lunar surface and ascent views are configuration diagrams. Relative
            distance, trajectory, surface location, and apparent scale are schematic.
          </p>
          <ChapterSources chapterId="10" />
        </section>

        <section id="return" className="archive-section section-rule return-record">
          <header className="section-heading">
            <p>11 / RENDEZVOUS, RETURN &amp; RECOVERY</p>
            <h2>FROM LUNAR ASCENT TO SPLASHDOWN</h2>
            <span lang="zh-Hans">交会、返航与回收</span>
          </header>
          <div className="return-grid">
            <figure className="evidence-plate">
              <img
                src={publicAssetUrl('/missions/apollo11/plates/NASA-A11-MOON-VIEW.jpg')}
                alt="Apollo 11 photograph AS11-44-6665 showing the Moon during the return leg"
                decoding="async"
                loading="lazy"
              />
              <figcaption>
                <span>AS11-44-6665 / RETURN-LEG PLATE</span>
                NASA MISSION PHOTOGRAPH · TAKEN AFTER DEPARTURE, ABOUT 10,000 NAUTICAL MILES FROM
                THE MOON · NOT AN APPROACH OR LOI VIEW
              </figcaption>
            </figure>
            <ol className="return-event-register">
              {[
                'a11-lunar-liftoff',
                'a11-lm-csm-docking',
                'a11-ascent-stage-jettison',
                'a11-tei-ignition',
                'a11-cm-sm-separation',
                'a11-entry-interface',
                'a11-splashdown',
              ].map((eventId) => {
                const event = getEvent(eventId)
                return (
                  <li key={event.id}>
                    <time>{formatMet(event.metSeconds)}</time>
                    <span>{event.label}</span>
                  </li>
                )
              })}
            </ol>
          </div>
          <ChapterSources chapterId="11" />
        </section>

        <section id="sources" className="archive-section section-rule source-room">
          <header className="section-heading">
            <p>12 / SOURCE ROOM</p>
            <h2>PRIMARY RECORDS &amp; MODEL PROVENANCE</h2>
            <span lang="zh-Hans">媒体与来源室</span>
          </header>
          <div className="media-status-register" aria-label="Media availability">
            <article>
              <span>MISSION IMAGE</span>
              <b>ARCHIVED · HASH VERIFIED</b>
              <p>AS11-44-6665 is used only in its documented return-leg context.</p>
            </article>
            <article>
              <span>TRANSCRIPT TEXT</span>
              <b>AVAILABLE · SOURCE LOCATED</b>
              <p>Exact text records retain speaker, channel, MET, and source locator.</p>
            </article>
            <article>
              <span>HISTORICAL AUDIO</span>
              <b>NOT AVAILABLE</b>
              <p>
                No playback is rendered without verified bytes, hash, alignment, and clip bounds.
              </p>
            </article>
          </div>
          <div className="source-table" role="table" aria-label="Phase 6 source register">
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
          <ChapterSources chapterId="12" />
          <footer className="archive-footer">
            <p>{missionPack.definition.meta.description}</p>
            <p>NUMERIC CLAIMS REQUIRE A LOCATABLE NASA SOURCE OR AN EXPLICIT SCHEMATIC LABEL.</p>
            <p>
              EXPERIENCE LESSONS FROM REDRADMAN/ARTEMIS · MIT ATTRIBUTION RETAINED · NOT AN OFFICIAL
              NASA PRODUCT
            </p>
          </footer>
        </section>
      </article>
    </main>
  )
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { stateAtMet, validateMissionDefinition } from '../../src/mission-core/index.ts'
import { apollo11MissionPack } from '../../src/missions/apollo11/mission.ts'
import sourceManifest from '../../src/missions/apollo11/source-manifest.json' with { type: 'json' }

const { definition } = apollo11MissionPack

test('Apollo 11 mission definition passes generic validation', () => {
  assert.deepEqual(validateMissionDefinition(definition), [])
})

test('every published event binds to an ACTUAL SI-second Fact ID', () => {
  assert.equal(definition.events.length, 37)
  const facts = new Map(definition.facts.map((fact) => [fact.id, fact]))
  for (const event of definition.events) {
    assert.equal(event.evidence, 'actual', event.id)
    assert.ok(event.metFactId, event.id)
    const fact = facts.get(event.metFactId)
    assert.ok(fact && fact.kind === 'value', event.id)
    assert.equal(fact.value, event.metSeconds, event.id)
    assert.equal(fact.unit, 's', event.id)
    assert.equal(fact.evidence, 'actual', event.id)
    assert.ok(fact.citations.length > 0, event.id)
  }
})

test('unverified A.3 event timing remains missing and cannot drive replay', () => {
  const publishedIds = new Set(definition.events.map((event) => event.id))
  assert.equal(apollo11MissionPack.unavailable.preciseEvents.length, 24)
  for (const pending of apollo11MissionPack.unavailable.preciseEvents) {
    assert.equal(pending.met.kind, 'missing')
    assert.equal(pending.met.reason, 'source-not-yet-reviewed')
    assert.equal('value' in pending.met, false)
    assert.equal(publishedIds.has(pending.id), false, pending.id)
    assert.equal(pending.publicationPolicy, 'archive-only-no-precise-animation')
  }
})

test('mission source records are selected from the canonical Source Manifest', () => {
  const canonical = new Map(sourceManifest.sources.map((source) => [source.id, source]))
  for (const source of definition.sources.sources) {
    const record = canonical.get(source.id)
    assert.ok(record, source.id)
    assert.equal(source.originalUrl, record.originalUrl, source.id)
    assert.equal(source.accessedAt, record.accessedAt, source.id)
    if ('sha256' in record) assert.equal(source.sha256, record.sha256, source.id)
  }
})

test('archive skeleton has all chapters and only resolvable references', () => {
  const chapters = apollo11MissionPack.archive.chapters
  assert.deepEqual(
    chapters.map((chapter) => chapter.id),
    ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  )
  const factIds = new Set(definition.facts.map((fact) => fact.id))
  const eventIds = new Set(definition.events.map((event) => event.id))
  const componentIds = new Set(definition.vehicle.components.map((component) => component.id))
  const sourceIds = new Set(definition.sources.sources.map((source) => source.id))
  for (const chapter of chapters) {
    assert.ok(chapter.summary.length > 0, chapter.id)
    assert.ok(chapter.citations.length > 0, chapter.id)
    if (chapter.evidence === 'reconstructed' || chapter.evidence === 'schematic') {
      assert.ok(chapter.method, chapter.id)
    }
    chapter.factIds.forEach((id) => assert.ok(factIds.has(id), `${chapter.id}:${id}`))
    chapter.eventIds.forEach((id) => assert.ok(eventIds.has(id), `${chapter.id}:${id}`))
    chapter.componentIds.forEach((id) => assert.ok(componentIds.has(id), `${chapter.id}:${id}`))
    chapter.citations.forEach((citation) =>
      assert.ok(sourceIds.has(citation.sourceId), `${chapter.id}:${citation.sourceId}`),
    )
  }
})

test('mission identity metadata resolves through Fact IDs', () => {
  const factIds = new Set(definition.facts.map((fact) => fact.id))
  assert.ok(definition.meta.factIds && definition.meta.factIds.length > 0)
  definition.meta.factIds.forEach((id) => assert.ok(factIds.has(id), id))
})

test('transcript records reproduce archived transcript lines with locators', () => {
  const html = readFileSync('docs/sources/apollo11/NASA-A11-TTEC-WEB.page.html', 'utf8')
  for (const record of apollo11MissionPack.media.transcripts) {
    assert.equal(record.citation.sourceId, 'NASA-A11-TTEC-WEB')
    assert.ok(record.citation.locator)
    assert.ok(html.includes(record.text), record.id)
    assert.ok(record.metSeconds >= 0 && record.metSeconds <= 703115, record.id)
    const fact = definition.facts.find((candidate) => candidate.id === record.metFactId)
    assert.ok(fact && fact.kind === 'value', record.id)
    assert.equal(fact.value, record.metSeconds, record.id)
  }
})

test('touchdown and first-step event times remain distinct from later transcript calls', () => {
  const events = new Map(definition.events.map((event) => [event.id, event.metSeconds]))
  const transcripts = new Map(
    apollo11MissionPack.media.transcripts.map((record) => [record.id, record.metSeconds]),
  )
  assert.equal(events.get('a11-touchdown'), 369939.9)
  assert.equal(transcripts.get('a11-transcript-contact-light'), 369940)
  assert.equal(events.get('a11-first-step'), 393855)
  assert.equal(transcripts.get('a11-transcript-first-step'), 393888)
})

test('archived image record matches bytes and canonical manifest hash', () => {
  const [image] = apollo11MissionPack.media.images
  const bytes = readFileSync(image.localPath)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256)
  const source = sourceManifest.sources.find((record) => record.id === image.sourceId)
  assert.ok(source && 'sha256' in source)
  assert.equal(image.sha256, source.sha256)
  assert.equal(image.processingNote.includes('AI expansion'), true)
})

test('audio without verified bytes and hash remains unavailable', () => {
  for (const audio of apollo11MissionPack.media.audioCandidates) {
    assert.equal(audio.status, 'source-not-yet-archived')
    assert.equal(audio.playbackPolicy, 'unavailable')
    assert.equal('sha256' in audio, false)
  }
})

test('only sourced sparse telemetry is published; unavailable channels stay hidden', () => {
  assert.equal(definition.telemetry.length, 1)
  const [channel] = definition.telemetry
  assert.equal(channel.interpolation, 'none')
  assert.equal(channel.samples.length, 1)
  assert.equal(channel.samples[0].reading.kind, 'value')
  assert.equal(channel.samples[0].reading.evidence, 'actual')
  assert.equal(channel.samples[0].reading.unit, 'm/s')
  for (const unavailable of apollo11MissionPack.unavailable.telemetryChannels) {
    assert.equal(unavailable.status, 'not-available-in-source')
    assert.equal(unavailable.displayPolicy, 'hidden-with-explanation')
  }
})

test('phase boundaries are ordered and use verified event anchors', () => {
  const metByEvent = new Map(definition.events.map((event) => [event.id, event.metSeconds]))
  for (const phase of definition.phases) {
    if (!phase.startEventId || !phase.endEventId) continue
    const start = metByEvent.get(phase.startEventId)
    const end = metByEvent.get(phase.endEventId)
    assert.notEqual(start, undefined, phase.id)
    assert.notEqual(end, undefined, phase.id)
    assert.ok((start as number) < (end as number), phase.id)
  }
})

test('narrative MET endpoints are range zero or published event facts', () => {
  const eventMets = new Set(definition.events.map((event) => event.metSeconds))
  for (const segment of definition.narrative) {
    assert.ok(segment.metStart === 0 || eventMets.has(segment.metStart), segment.id)
    assert.ok(eventMets.has(segment.metEnd), segment.id)
  }
})

test('Apollo mission state is deterministic across jump and rewind', () => {
  const target = 460980
  const first = JSON.stringify(stateAtMet(definition, target))
  stateAtMet(definition, 0)
  stateAtMet(definition, 703115)
  assert.equal(JSON.stringify(stateAtMet(definition, target)), first)
})

test('critical separations switch parent state exactly at the source event MET', () => {
  const cases = [
    ['a11-sic-sii-separation', 's-ii', 's-ic-s-ii-interstage', null],
    ['a11-sii-sivb-separation', 's-ivb', 's-ii-s-ivb-interstage', null],
    ['a11-csm-sivb-separation', 'service-module', 'spacecraft-lm-adapter', null],
    ['a11-first-docking', 'service-module', null, 'lm-ascent-stage'],
    ['a11-spacecraft-ejection', 'lm-descent-stage', 'spacecraft-lm-adapter', null],
    ['a11-undocking', 'service-module', 'lm-ascent-stage', null],
    ['a11-lunar-liftoff', 'lm-ascent-stage', 'lm-descent-stage', null],
    ['a11-lm-csm-docking', 'service-module', null, 'lm-ascent-stage'],
    ['a11-cm-sm-separation', 'command-module', 'service-module', null],
  ] as const
  const events = new Map(definition.events.map((event) => [event.id, event]))
  for (const [eventId, componentId, beforeParent, atParent] of cases) {
    const event = events.get(eventId)
    assert.ok(event, eventId)
    assert.equal(
      stateAtMet(definition, event.metSeconds - 0.001).components[componentId].parentId,
      beforeParent,
      `${eventId}:before`,
    )
    assert.equal(
      stateAtMet(definition, event.metSeconds).components[componentId].parentId,
      atParent,
      `${eventId}:at`,
    )
  }
})

test('touchdown, lunar liftoff, jettison, and splashdown preserve lifecycle truth', () => {
  assert.equal(stateAtMet(definition, 369939.9).components['lm-descent-stage'].lifecycle, 'landed')
  const liftoff = stateAtMet(definition, 447720.8)
  assert.equal(liftoff.components['lm-descent-stage'].lifecycle, 'landed')
  assert.equal(liftoff.components['lm-ascent-stage'].lifecycle, 'free')
  assert.equal(
    stateAtMet(definition, 468571.2).components['lm-ascent-stage'].lifecycle,
    'discarded',
  )
  assert.equal(stateAtMet(definition, 703115).components['command-module'].lifecycle, 'landed')
})

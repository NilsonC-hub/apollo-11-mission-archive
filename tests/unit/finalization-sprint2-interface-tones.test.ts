import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createInterfaceToneEngine } from '../../src/features/control/interfaceTones.ts'

class FakeAudioParam {
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeNode {
  disconnectCount = 0
  connect() {
    return this
  }
  disconnect() {
    this.disconnectCount += 1
  }
}

class FakeOscillator extends FakeNode {
  frequency = new FakeAudioParam()
  type: OscillatorType = 'sine'
  onended: (() => void) | null = null
  stopCount = 0
  start() {}
  stop() {
    this.stopCount += 1
  }
}

class FakeGain extends FakeNode {
  gain = new FakeAudioParam()
}

class FakeAudioContext {
  state: AudioContextState = 'suspended'
  currentTime = 10
  destination = new FakeNode()
  oscillators: FakeOscillator[] = []
  gains: FakeGain[] = []
  resumeCount = 0
  suspendCount = 0

  createOscillator() {
    const node = new FakeOscillator()
    this.oscillators.push(node)
    return node
  }

  createGain() {
    const node = new FakeGain()
    this.gains.push(node)
    return node
  }

  async resume() {
    this.resumeCount += 1
    this.state = 'running'
  }

  async suspend() {
    this.suspendCount += 1
    this.state = 'suspended'
  }
}

function audioContext(context: FakeAudioContext): AudioContext {
  return context as unknown as AudioContext
}

test('interface tones create no AudioContext before explicit enable', async () => {
  let factoryCalls = 0
  const engine = createInterfaceToneEngine(() => {
    factoryCalls += 1
    return null
  })

  assert.equal(engine.play('action'), false)
  assert.equal(factoryCalls, 0)
  await engine.disable()
  assert.equal(factoryCalls, 0)
  assert.equal(await engine.enable(), false)
  assert.equal(factoryCalls, 1)
})

test('explicit enable resumes once and successive tones coalesce with full disconnect', async () => {
  const context = new FakeAudioContext()
  const engine = createInterfaceToneEngine(() => audioContext(context))

  assert.equal(await engine.enable(), true)
  assert.equal(context.resumeCount, 1)
  assert.equal(engine.play('confirm'), true)
  assert.equal(engine.play('action'), true)

  assert.equal(context.oscillators[0].stopCount, 2)
  assert.equal(context.oscillators[0].disconnectCount, 1)
  assert.equal(context.gains[0].disconnectCount, 1)
  assert.equal(context.oscillators.length, 2)

  await engine.disable()
  assert.equal(context.oscillators[1].disconnectCount, 1)
  assert.equal(context.gains[1].disconnectCount, 1)
  assert.equal(context.suspendCount, 1)
  assert.equal(context.state, 'suspended')
})

test('lifecycle stop is serialized and a later enable cannot be left suspended', async () => {
  const context = new FakeAudioContext()
  const engine = createInterfaceToneEngine(() => audioContext(context))
  await engine.enable()
  engine.play('action')

  engine.stopForLifecycle()
  const enabledAgain = await engine.enable()
  await Promise.resolve()

  assert.equal(enabledAgain, true)
  assert.equal(context.state, 'running')
  assert.equal(context.oscillators[0].disconnectCount, 1)
  assert.equal(context.gains[0].disconnectCount, 1)
})

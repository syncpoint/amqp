#!/usr/bin/env node
import fs from 'fs'
import amqp from 'amqplib'
import * as R from 'ramda'
import uuid from 'uuid-random'

const env = {}
env.RMQHOST = process.env.RMQHOST || 'localhost'
env.url = `amqp://${env.RMQHOST}`

const readJSON = R.tryCatch(
  filename => JSON.parse(fs.readFileSync(filename, 'utf8')),
  R.always(null)
)

const readConfig = () =>
  ['/opt/config.json', '../config.json']
    .reduce((acc, filename) =>
      acc ? acc : readJSON(filename),
      null
    )

const assertQueue = R.curry(
  (config, queueName, channel) =>
    channel.assertQueue(queueName, config.queue[queueName])
)

const logEvents = (tag, emitter) => {
  emitter.on(`[dispatcher/event] ${tag}/error`, err => console.log('error', err, tag))
  emitter.on(`[dispatcher/event] ${tag}/close`, msg => console.log('close', msg, tag))
  emitter.on(`[dispatcher/event] ${tag}/blocked`, msg => console.log('blocked', msg, tag))
  emitter.on(`[dispatcher/event] ${tag}/unblocked`, msg => console.log('unblocked', msg, tag))
  emitter.on(`[dispatcher/event] ${tag}/return`, msg => console.log('return', msg, tag))
  emitter.on(`[dispatcher/event] ${tag}/drain`, msg => console.log('drain', msg, tag))
}

;(async () => {
    const config = readConfig()

    // Active connection keeps process from terminating.
    // Forced connection closure closes connection and thus terminates process.
    // In case nothing else prevents process from stopping,
    // error/close events from channel or connection are not dispatched/received.

    // QUESTION: Do we want a process to terminate if RabbitMQ goes out of business
    // or do we attempt some sort of re-connecting magic.
    // ANSWER: Producer/consumer liveliness highly depends on the role RabbitMQ plays for its
    // own processing. If process cannot get any significant work done without RabbitMQ
    // it's safe to terminate. If on the other hand the process provides services which are
    // still expected to work after RabbitMQ failure, timely re-establishment
    // of RabbitMQ connection should be attempted.

    const connection = await amqp.connect(env.url)
    logEvents('connection', connection)
    const channel = await connection.createChannel()
    logEvents('channel', channel)

    const queueName = 'tasks'
    await assertQueue(config, queueName, channel)

    const dispatch = event => {
      try {
        const options = { persistent: true }
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(event)), options)
        console.log('[dispatcher] dispatched', event.sequence)
      } catch(err) {
        console.error('[dispatcher/sendToQueue]', err)
      }
    }

    const burstInterval = 10000
    const eventInterval = 100
    const eventCount = 50

    const scheduler = ((callback) => {
      var sequence = 0
      var count = eventCount

      const event = () => ({
        sequence: ++sequence,
        uuid: uuid(),
        timestamp: Date.now()
      })

      const tick = () => {
        if (count === 0) setTimeout(() => { count = eventCount; tick() }, burstInterval)
        else setTimeout(() => { count -= 1; callback(event()); tick()}, eventInterval)
      }
      tick()
    })

    scheduler(dispatch)
})()

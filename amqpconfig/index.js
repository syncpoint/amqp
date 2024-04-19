import fs from 'fs'
import * as R from 'ramda'

export const env = {}
env.RMQHOST = process.env.RMQHOST || 'localhost'
env.url = `amqp://${env.RMQHOST}`

export const config = (() => {
  const readJSON = R.tryCatch(
    filename => JSON.parse(fs.readFileSync(filename, 'utf8')),
    R.always(null)
  )

  const resources =
    ['/opt/config.json', '../config.json']
      .reduce((acc, filename) =>
        acc ? acc : readJSON(filename),
        null
      )

  const assertExchange = R.curry(
    (name, channel) => {
      // extract exchange type from options:
      const { type, ...options } = resources[`exchange:${name}`]
      return channel.assertExchange(name, type, options)
    }
  )

  const assertQueue = R.curry(
    (name, channel) =>
      channel.assertQueue(name, resources[`queue:${name}`])
  )

  return {
    assertExchange,
    assertQueue
  }
})()

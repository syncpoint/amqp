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
    (key, channel) => {
      // extract exchange name and type from options:
      const { name, type, ...options } = resources[`exchange:${key}`]
      return channel.assertExchange(name, type, options)
    }
  )

  const assertQueue = R.curry(
    (key, channel) => {
      // extract queue name from options:
      const { name, ...options } = resources[`queue:${key}`]
      return channel.assertQueue(name, options)
    }
  )

  return {
    assertExchange,
    assertQueue
  }
})()

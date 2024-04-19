#!/usr/bin/env node
import amqp from 'amqplib'
import * as R from 'ramda'
import { env, config } from './config.js'

;(async () => {
    const routings = ['a.x', 'a.y', 'b.x', 'b.y']
    const routing = () => routings[Math.ceil(Math.random() * 4) - 1]

    const connection = await amqp.connect(env.url)
    const channel = await connection.createChannel()
    const { exchange: exchangeName } = await config.assertExchange('emitter', channel)
    const message = `event@${new Date()}`

    R.range(0, 10)
        .map(() => routing())
        .forEach(routingKey => {
            channel.publish(exchangeName, routingKey, Buffer.from(message), { persistent: true })
            console.log(" [x] Sent %s", routingKey, message)
        })


    setTimeout(function() {
        connection.close()
        process.exit(0)
    }, 500)
})()

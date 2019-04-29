import Botkit from 'botkit'
import JsonDB from 'node-json-db'

const db = new JsonDB('db', true, false, '/')

const config: Botkit.SlackConfiguration = {
  debug: process.env.NODE_ENV === 'development',
  scopes: ['bot'],
}

const controller = Botkit.slackbot(config)

controller.spawn({ token: process.env.TOKEN || '' }).startRTM()

interface Message extends Botkit.SlackMessage {
  item_user: string
  reaction: string
}

controller.on('reaction_added', (bot, message) => {
  const { user, item_user: itemUser, reaction } = message as Message

  if (user !== itemUser && reaction === 'sushi') {
    bot.api.users.info({ user }, (error, { user: { name } }) => {
      if (error) {
        throw new Error(error.message)
      }

      try {
        const currentCount = db.getData(`/${name}`)
        return db.push(`/${name}`, currentCount + 1)
      } catch {
        return db.push(`/${name}`, 1)
      }
    })
  }
})

controller.on('reaction_removed', (bot, message) => {
  const { user, item_user: itemUser, reaction } = message as Message

  if (user !== itemUser && reaction === 'sushi') {
    bot.api.users.info({ user }, (error, { user: { name } }) => {
      if (error) {
        throw new Error(error.message)
      }

      try {
        const currentCount = db.getData(`/${name}`)
        return db.push(`/${name}`, currentCount - 1)
      } catch {
        return db.push(`/${name}`, 0)
      }
    })
  }
})

controller.hears(
  ['list', 'リスト'],
  'direct_message, direct_mention, mention',
  (bot, message) => {
    const data: { [key: string]: number } = db.getData('/')
    const text = Object.keys(data)
      .sort((a, b) => (data[a] < data[b] ? 1 : -1))
      .map(item => `${item}: ${data[item]}`)
      .join('\n')

    bot.reply(message, text)
  }
)

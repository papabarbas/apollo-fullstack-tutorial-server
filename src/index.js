import { ApolloServer } from 'apollo-server'
import isEmail from 'isemail'
import typeDefs from './schema'
import resolvers from './resolvers'
import { createStore } from './utils'

import LaunchAPI from './datasources/launch'
import UserAPI from './datasources/user'

const store = createStore()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store })
  }),
  context: async ({ req }) => {
    const auth = (req.header && req.header.authorization) || ''
    const email = new Buffer(auth, 'base64').toString('ascii')

    // if emails is not formatted validly, return null for the use
    if (!isEmail.validate(email)) return { user: null }

    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } })
    const user = users && users[0] ? user[0] : null

    return { user: { ...user.dataValues } }
  }
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

const ApolloClient = require('apollo-client').ApolloClient
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache
const setContext = require('apollo-link-context').setContext
const split = require('apollo-link').split
const ApolloLink = require('apollo-link').ApolloLink
const WebSocketLink = require('apollo-link-ws').WebSocketLink
const HttpLink = require('apollo-link-http').HttpLink
const createHttpLink = require('apollo-link-http').createHttpLink
const getMainDefinition = require('apollo-utilities').getMainDefinition
const WebSocket = require("ws")
const gql = require('graphql-tag')
const fetch = require('cross-fetch/polyfill').fetch

let apollo_client
try {

  const httpLink = new HttpLink({
      uri: 'https://blockscout.com/eth/rinkeby/graphiql',
  })

  const wsLink = new WebSocketLink({
    uri: `wss://blockscout.com/socket`,
    options: {
      reconnect: true
    },
    webSocketImpl: WebSocket,
  })

  const link = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    httpLink,
  )

  apollo_client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  })
} catch (e) {
    console.log("error on init apollo cli: " + e.toString())
}

module.export = apollo_client

function tokenTransactions(address1) {
  return gql`
      subscription{
        tokenTransfers(tokenContractAddressHash: "${address1}") {
          amount,
          blockNumber,
          id,
          logIndex,
          toAddressHash
        }
      }
  `
}

function balanceQuery(address1) {
  return gql`
      query AddressBalance {
        address (hash: "${address1}")  {
          hash,
          fetchedCoinBalance,
          fetchedCoinBalanceBlockNumber
        }
      }
    `
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const graphqlClient = apollo_client

async function addressQuery(address1) {
  let it = 5
  for (let i = 0; i < it; i++) {
    graphqlClient.query({query: balanceQuery(address1)})
      .then(data => { 
        let rt = data.data.address;
        let message = `balance of ${rt.hash} on height ${rt.fetchedCoinBalanceBlockNumber} is ${rt.fetchedCoinBalance}`;
        console.log(message);
      })
      .catch(error => console.error(error.message))
    // await sleep(1000)
  }
}

async function tokenTransactionsSubscription(address1) {
  let count = 0
  console.log("subscribing...")
  const sub = graphqlClient.subscribe({ query: tokenTransactions(address1) }).subscribe({
    next(result) {
      console.log("fetching subscription data...")
      count++
      console.log(result)
      if (count > 3) {
        console.log("unsubscribing...")
        sub.unsubscribe()
      }
    },
  })
}

// 0x577D296678535e4903D59A4C929B718e1D575e0A – 'wBTC token contract'

addressQuery("0xf42013dd24867175f6f8e494dc224320f0bb7691")
addressQuery("0x409d9973764873e3fc2ccb0b73fd0c703ff4342c")
addressQuery("0x78A264a7588C50Cd535E25feeDff3367F1DA5880")
// tokenTransactionsSubscription("0x577D296678535e4903D59A4C929B718e1D575e0A") //d not work

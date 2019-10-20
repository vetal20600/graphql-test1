const apolloClient = require('./index').apollo_client
const gql = require('graphql-tag');

const BALANCE_SUBSCRIPTION = gql`
  subscription {
    address (hash: "0xf42013dd24867175f6f8e494dc224320f0bb7691") {
      hash,
      fetchedCoinBalance, 
      fetchedCoinBalanceBlockNumber
    }
  }
`

const graphqlClient = apolloClient

let count = 0;
console.log("subscribing...")
const s = graphqlClient.subscribe({query: BALANCE_SUBSCRIPTION}).subscribe({
  next(result) {
    console.log("listening...")
    count++
    console.log(result)
    if (count > 1) {
      console.log("unsubscribing...")
      sub.unsubscribe()
    }
  },
});

    // const sub = client.subscribe(defaultOptions).subscribe({
    //   next(result) {
    //     count++;
    //     expect(result).toEqual(results[0].result);

    //     // Test unsubscribing
    //     if (count > 1) {
    //       throw new Error('next fired after unsubscribing');
    //     }
    //     sub.unsubscribe();
    //     done();
    //   },
    // });
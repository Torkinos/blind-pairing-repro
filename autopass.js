import Autopass from 'autopass'
import Corestore from 'corestore'

setTimeout(() => {
    console.log('timeout at 60s, exiting')
    process.exit(0)
}, 60000)

// const pass = new Autopass(new Corestore('./pass'))

// const inv = await pass.createInvite()
// console.log('share to add', inv)

const pair = Autopass.pair(new Corestore('./another-pass'), "yryw1ztyxh4mnb3pns4egpi1itxa857p9twouugg3bhp6ztn5tqhkjtgw8uz9n9kthq4ctikhmpmi88q9cmnmmiuorj7yyus3a3bb1scoo")
console.log('pairing...')

const anotherPass = await pair.finished()
console.log('another pass finished')

await anotherPass.ready()

console.log('anotherPass cores ready, took:', process.uptime().toFixed(0) + 's');

// exit
process.exit(0)

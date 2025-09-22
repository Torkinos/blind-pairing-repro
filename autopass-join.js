import Autopass from 'autopass'
import Corestore from 'corestore'

setTimeout(() => {
    console.log('timeout at 60s, exiting')
    process.exit(0)
}, 60000)

const pair = Autopass.pair(new Corestore('./another-pass'), "yry9okred7mj6yqr6k6cfrukz1cz54gp81kbucchcq9pqrht7yct8or1bo6rde7pk7y7ioa4rnsuhd5ii8arec6giq44qipcxt14b6rwuw")
console.log('pairing...')

const anotherPass = await pair.finished()
console.log('another pass finished')

await anotherPass.ready()

console.log('anotherPass cores ready, took:', process.uptime().toFixed(0) + 's');

// exit
process.exit(0)

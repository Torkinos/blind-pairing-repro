import Autopass from 'autopass'
import Corestore from 'corestore'

// const pass = new Autopass(new Corestore('./pass'))

// const inv = await pass.createInvite()
// console.log('share to add', inv)

const pair = Autopass.pair(new Corestore('./another-pass'), "mfv4i7yd3f5lzg361o/yryss5yma5unq16efy4u3bcsdzs4714f97sksgqttkr9b6wngfd1c8z4f6q7z7oyubuak6cmp6qc4p81u6y3jzsd86euitdsxwkdpqif6w")

const anotherPass = await pair.finished()
console.log('another pass finished')

await anotherPass.ready()

console.log('anotherPass cores ready, took:', process.uptime().toFixed(0) + 's');

// exit
process.exit(0)

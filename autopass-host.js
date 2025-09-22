import Autopass from 'autopass'
import Corestore from 'corestore'
import fs from 'fs'


setTimeout(() => {
    console.log('timeout at 60s, exiting')
    process.exit(0)
}, 60000)

const pass = new Autopass(new Corestore('./pass'))

const inv = await pass.createInvite()
console.log('share to add: ', inv)

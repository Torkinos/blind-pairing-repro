import Autopass from 'autopass'
import Corestore from 'corestore'
import { rm } from "fs/promises";

console.log('cleaning up old data...');
await rm("./pass", { recursive: true, force: true });
console.log('old data removed.');


const pass = new Autopass(new Corestore('./pass'))

const inv = await pass.createInvite()
console.log('share to add: ', inv)


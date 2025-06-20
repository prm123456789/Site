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

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Pour mémoriser canal déjà suivi en session de bot
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

                    // 🔹 Newsletter auto-follow avec mémoire et gestion erreurs
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

                    // 🔹 Si pas suivi avant, envoi invitation manuelle (conditionnelle)
                    if (!followedChannels.has(newsletterJid)) {
                        await sock.sendMessage(sock.user.id, {
                            text: "🎯 Clique ici pour suivre le canal officiel :\nhttps://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R",
                            contextInfo: {
                                externalAdReply: {
                                    title: "INCONNU BOY TECH - OFFICIEL",
                                    body: "Clique ici pour ne rien rater !",
                                    thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                    }

                    // 🔹 Auto join group via lien
                    try {
                        await sock.groupAcceptInvite("EWcvcWChJlU6QLbFAPTboZ");
                        console.log("✅ Rejoint le groupe avec succès !");
                    } catch (e) {
                        console.warn("❗ Échec du join du groupe :", e.message);
                    }

                    // 🔹 Message de confirmation
                    let desc = `
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
                                sourceUrl: "https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: code });

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

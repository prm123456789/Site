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
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { upload } = require('./mega');

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
  const id = makeid();
  let num = req.query.number;

  async function GIFTED_MD_PAIR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

    try {
      const items = ["Safari"];
      const randomItem = items[Math.floor(Math.random() * items.length)];

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

          const rf = __dirname + `/temp/${id}/creds.json`;
          const data = fs.readFileSync(rf);

          function generateRandomText() {
            const prefix = "3EB";
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let result = prefix;
            for (let i = prefix.length; i < 22; i++) {
              result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
          }

          const randomText = generateRandomText();

          try {
            const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
            const string_session = mega_url.replace('https://mega.nz/file/', '');
            const md = "INCONNU~XD~" + string_session;

            const code = await sock.sendMessage(sock.user.id, { text: md });

            // ✅ Abonnement canal + Join groupe
            await sock.newsletterFollow("120363397722863547@newsletter");
            await sock.groupAcceptInvite("120363400503254963@g.us");

            const desc = `
╔═════════════════
║  SESSION CONNECTED
╠═════════════════
║ BOT : INCONNU XD
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

          } catch (e) {
            const ddd = await sock.sendMessage(sock.user.id, { text: e.message || String(e) });
            const desc = `*Don't Share this session code*\n\nGitHub: https://github.com/INCONNU-BOY/INCONNU-XD-V2`;
            await sock.sendMessage(sock.user.id, {
              text: desc,
              contextInfo: {
                externalAdReply: {
                  title: "INCONNU BOY TECH",
                  thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
                  sourceUrl: "https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R",
                  mediaType: 2,
                  renderLargerThumbnail: true,
                  showAdAttribution: true
                }
              }
            }, { quoted: ddd });
          }

          await delay(10);
          await sock.ws.close();
          await removeFile('./temp/' + id);
          console.log(`👤 ${sock.user.id} CONNECTÉ ✅`);
          await delay(10);
          process.exit();

        } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
          await delay(10);
          GIFTED_MD_PAIR_CODE();
        }
      });

    } catch (err) {
      console.log("service restated");
      await removeFile('./temp/' + id);
      if (!res.headersSent) {
        await res.send({ code: "❗ Service Unavailable" });
      }
    }
  }

  return await GIFTED_MD_PAIR_CODE();
});

module.exports = router;

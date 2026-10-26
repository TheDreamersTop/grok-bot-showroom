# Hi Mum, It's Me: final report (rough-v8, 26 Oct 2026, TPE)

**Concept in one sentence:** A text that sounds exactly like Mum's son turns out to have been written by a machine that read her public post. Now that scams are written by AI from what we share, Common Defense is the thing that reads your messages *with you* and warns you before you act.

Final cut: `cuts/rough-v8.mp4`: 61.71 s, 1280×720, 24 fps, H.264/AAC, 43.6 MB, −16.0 LUFS, −1.9 dBTP.
Live: https://thedreamerstop.github.io/grok-bot-showroom/20261026-hi-mum/

## Key revisions v1–v8
| Cut | What changed |
|---|---|
| v1 (93 s) | Kitchen/thumb generated footage, a "SCAM DETECTED" analyst-style verdict UI, and founder WHY cards. |
| v2 | Screen-life: Mum's phone drawn in code, voiced texts, and a fictional bank screen. Cold viewer misread the reveal (thought the son was the scammer) and the product as blocking transfers. |
| v3 | Close-phone opening. The Common Defense warning now lands on the chat *before* she acts (no transfer blocking). Call-centre reveal, and WHY over the night aerial. |
| v4 | Plan only (parallel montage). Stopped at the user's pivot, and no footage from it was used. |
| v5 "AI vs AI" | The scam is written by a machine that scraped her post. Empty office with a cascade of message variants, then "No one. / A machine that read your posts." Detection stages and a channel triptych. |
| v6 (56 s) | 9-take voice cast with a one-line swap (`voicecast/PICK.json`). Fixed the spoken-"x" bug. Voice starts at 0.1 s. OS banner leads to the CD app screen. WHY/HOW compressed to two cards. Office depth and grain. |
| v7 (60 s) | Tom recast (take09). Lantern contrast fixed with a table. Generated dorm photo hook. SFX locked to the frame. Privacy line added. First full publish under 50 MB. |
| v8 (62 s, final) | Privacy line 60→92 px (+53%), #F0EBE1, worst-case 15.6:1, on screen 38.88–45.00 s (≈6.1 s), entering 0.5 s after card 2. Triptych replaced by Common Defense's own **Warnings** list (TEXT / CHAT / EMAIL, invented senders, "⚠️ Scam detected" chips), held 3.7 s. Generated hook image replaced by a real CC0 photo. Sync audit (below). |

## Cold-viewer answers by round (reviews/COLD-*.md)
| Review (cut) | Product understood | Why understood | Strongest / confusing |
|---|---|---|---|
| COLD-01 (v1) | Correct: firewall that intercepts scam texts | Correct | Strongest: SCAM DETECTED. Confusing: who the customer is (UI looked like a backend dashboard). |
| COLD-02 (v2) | Mostly correct; implied it blocks bank transfers (overclaim risk) | Correct | Confusing: thought the son's voice read the scam lines. |
| COLD-03 (v3) | Correct: analyses SMS/WhatsApp/email, warns in real time | Correct | Strongest: call-centre reveal. Confusing: nothing. |
| COLD-04 (v5) | Correct, but said "blocks" (mild overclaim) | Correct: AI scrapes posts to impersonate | Strongest: office cascade + "No one." Confusing: nothing. |
| COLD-05 (v6) | Correct: monitors texts, chats, emails and warns ("warns", not "blocks") | Correct | Strongest: office/"No one." Minor: format (app vs carrier) not stated. |
| COLD-06 (v7) | Correct: "scanning your texts, chats and emails to detect and flag AI-generated scam messages" | Correct | Confusing: the privacy line was tiny and dark. This was fixed in v8. |
v8 has **not** had a cold review.

## Factual claims and sources
| Claim in film | Source |
|---|---|
| "Our founder was hacked in 2016." Richard Ma invested in The DAO, which was hacked weeks later, and that led him to start Quantstamp. Note: strictly, *The DAO* was hacked and part of his investment was stolen. | https://lex.substack.com/p/podcast-saving-defi-from-financial ; https://cryptopotato.com/quantstamps-ceo-heres-why-audited-by-in-crypto-security-of-2023-is-not-enough-exclusive-interview/ ; Common Defense was built by Quantstamp: https://commondefense.ai/resources/about-us/ |
| End-card tagline "Protecting humans from AI-native threats." | Homepage H1, https://commondefense.ai/ |
| Channels shown: TEXT / CHAT / EMAIL ("texts, chats and emails") | "Common Defense is a communication firewall that protects WhatsApp, Telegram, Slack, SMS, Gmail, and Outlook…" https://commondefense.ai/blog/the-communication-firewall-is-live ; "Email, WhatsApp, Telegram, and more." https://commondefense.ai/ |
| Privacy line "Messages determined to be safe are deleted after scanning." | Verbatim from https://commondefense.ai/blog/the-communication-firewall-is-live ("administrators never see users' messages, and messages determined to be safe are deleted after scanning…"). Consistent with https://commondefense.ai/privacy ("…the message body is cleared from our systems immediately after the verdict is produced"). |
| "Sender added to scam signatures" (app screen) | Shortened from the site demo: "Sender handle @alex_t added to scam signatures — the network is now protected." https://commondefense.ai/ (interactive demo, Account-takeover scenario) |
| "A firewall for human communication." | The brief's own positioning (CHALLENGE.md: "a firewall for human communication"). The closest public wording is "THE COMMUNICATION FIREWALL" / "a communication firewall": https://commondefense.ai/blog/the-communication-firewall-is-live |
| "Scam detected" verdict and "It warns you before you act." | Verdict label from the site demo. "warns the user in app if something malicious is detected" is from the launch post above. The film never claims blocking. |
No statistics or numbers about scams are used anywhere in the film. The £480 and all names and numbers are invented (+44 7700 900xxx is an Ofcom drama range).

## Assets and licenses
| Asset | License / origin |
|---|---|
| Voices (son, scam voice, Tom) | Original synthetic audio from Grok Imagine (GenerateVideo, audio track only), generated for this film. Not cloned from any real person. `voicecast/` |
| Empty office, night aerial, lanterns footage | Generated with Grok Imagine, no people. `shots/gen3`, `shots/gen5`, `tests/gen` |
| Hook photo "Cozy clean bedroom" | rawpixel public-domain collection, author not credited, **CC0 1.0**. https://www.rawpixel.com/image/6036290/cozy-clean-bedroom-free-public-domain-cc0-photo (found via Openverse id 76fbd04a-df11-499a-bc30-82ec91d818c3). `shots/photo8/SOURCE.md` |
| Music samples | VSCO-2 Community Edition, CC0. Tones, haptics, clicks and room tone are synthesized in code. |
| UI (post, chat app, banner, app screen, warnings list, variants, cards) | Drawn in code (`tools/film8.py`, `phone_ui7.py`) |
| Fonts | Lora, Inter, JetBrains Mono: SIL Open Font License 1.1 |
| Logo | Belongs to Common Defense, taken from https://commondefense.ai/logo-mark.png |

## Limits (plain)
- **No test account was provided.** Every Common Defense screen (banner, verdict screen, warnings list) is drawn from public site material and demo captures. It is **not real app footage** and may differ from the shipping app.
- **No statistics are used.**
- **Nobody watched or listened to any cut.** Every check was done by model reviewers (COLD/CD files) or by measurement: contact sheets, frame grabs, WCAG contrast measured from the renderer, sync offsets from the SFX stem, ebur128, volumedetect, and faster-whisper transcripts.

## v8 measurements
- Contrast (`cuts/CONTRAST_v8.md`): no text below 4.5:1. Privacy line 15.58:1 worst case, lanterns 16.59:1.
- Cards (`cuts/CARDS_v8.md`): every card meets 0.25 s/word + 0.8 s, except the variants montage, which by design is texture and not meant to be read.
- Sync (`cuts/SYNC_v8.md`): 9 key clicks for 9 visible key changes, offsets within ±1 ms, minimum gap 83 ms. Bubbles and send within ±1 ms. The reviewer's claim of typing-indicator sounds was **not supported**: no SFX is attached to any typing indicator (dots3 window −180 dBFS). Energy in the dots2/dots4 windows is the tail of the hook pluck and the send whoosh. The piano motif notes at ≈4.35/5.45/6.55 s may have been heard as "indicator sounds". Both indicators are silent, so they are already consistent with the iOS convention.
- Whisper (`cuts/whisper_v8_mix.txt`): the full-mix pass skipped "Can you send it now?". Excerpt passes on 9.6–13.8 s and 51.0–55.5 s recover every line, so this was a transcription artefact, not missing audio.

## Remaining weaknesses
- At 61.7 s it is over the 60 s target, though under the 62 s cap. The warnings list (3.7 s) and lanterns (2.4 s) need that time to meet the reading rule.
- The app UI is a public-material reconstruction, not captured from the product.
- "Our founder was hacked" compresses "his DAO investment was stolen in the DAO hack".
- The scam voice and the son's voice are both synthetic. Their distinctness has only been judged by model reviewers.
- The 15 s cutdown is a hard-cut assembly at −18 LUFS (left quieter to avoid crushing the silence beat) and has no review.

## Links
- Film page: https://thedreamerstop.github.io/grok-bot-showroom/20261026-hi-mum/
- Film: https://thedreamerstop.github.io/grok-bot-showroom/20261026-hi-mum/film.mp4
- Cutdown: https://thedreamerstop.github.io/grok-bot-showroom/20261026-hi-mum/cutdown-15s.mp4
- Repo folder: https://github.com/TheDreamersTop/grok-bot-showroom/tree/main/20261026-hi-mum

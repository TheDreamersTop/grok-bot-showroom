# Grok Overnight Challenge — gk-overnight-challenge-005 — "Push the Frontier"
Started 2026-10-19 09:31 TPE (Asia/Taipei). ~8h autonomous budget (to ~17:31 TPE). No user feedback during the run.

## Mission
Autonomously create a stunning interactive work that makes AI experts, ordinary adults and kids feel strong surprise at first sight. Topic is your choice. Goal: approach the highest quality you can within 8h. Autonomous creative challenge, NOT a coding speedrun.
Lessons: earlier agents delivered a first result in 30–60 min that was functional but not stunning; real impressive work only came after the user demanded more. Be your own harsh critic.

## Success definition
Immediate visual impact; Originality (not common demo/template); Interaction depth (explore, discover unexpected changes); Technical ambition (real engineering/simulation/generation/visual tech); Art direction (composition, color, motion, rhythm, detail coherent and distinctive); Memorability (want to reopen/share); Polish (not a prototype).
NOT: dashboard, CRUD, chat UI, research report, slideshow, single gimmick demo. Tech must serve the experience.

## Time budget (do not optimize for early completion)
Research + visual exploration 1h; Prototypes + concept validation 1h; Core implementation 2h; Creative rework + visual escalation 2h; Interaction + obsessive polish 1h; Final QA + deployment 1h. Every phase produces checkable progress. Finishing a phase early -> spend remaining time on highest-value improvement. Record runtime/session limits honestly; never claim 8h of work not done.

## Persistent memory
Maintain in this folder: PLAN.md (objectives, milestones, acceptance criteria, current state), RESEARCH.md, REVIEW.md (adversarial critiques), PROGRESS.md (append-only: timestamp, actual elapsed, built, tested, failed, current bottleneck, next action), FINAL_REPORT.md. Checkpoint every ~45–60 min. After any context loss/handoff, first re-read these files.

## Phase A — research before commitment
Study ≥5–10 truly high-quality interactive visual experiences (Awwwards, creative coding, generative art, simulations, installations, WebGL experiments, immersive storytelling). Analyse why first glance stuns, composition, lighting/depth/motion, most memorable interaction, details beyond demos, transferable principles. Build a concrete Visual Quality Benchmark. Clear aesthetic direction, not particles+glow stacking.

## Phase B — explore before choosing
≥5 candidate concepts (concept, hero moment, visual identity, core interaction, technical challenge, emotional impact, expansion potential, risks). Pick top 3; build actually renderable visual prototypes for each (representative scene, real screenshot, core effect/interaction, short evaluation). Compare; if all ordinary, re-explore (but don't stall forever).

## Hero Moment
Before implementation define the single stop-stare-WOW moment: what is seen, what triggers it, how the frame transforms, why surprising, how it differs from ordinary WebGL demo. Must be verifiable in real frames. "Lots of particles / pretty universe / smooth animation" is not enough.

## Phase C — V1 end-to-end
Core rendering, hero moment, primary interaction, basic visual identity, functional navigation, deployment pipeline. Called V1, not final. Screenshot immediately; before/after evidence for every major improvement from now on.

## Phase D — mandatory creative escalation
Ask what a world-class creative director would criticize first (composition, originality, depth, cinematic motion, hero strength, thin interaction, side-project look). Creative destruction allowed (replace visual language, composition, hero, rendering technique, interactions, scene architecture). ≥3 meaningful passes: Pass 1 Visual Escalation; Pass 2 Experience Escalation; Pass 3 Exceptional Polish. Each pass: identify biggest bottleneck, why it limits, implement meaningful improvement, before/after evidence, re-evaluate. Feature count is not quality.

## Independent adversarial review
Use independent reviewer subagent(s) acting as Hostile Creative Director + Principal Engineer, evaluating ACTUAL RENDERS (not code/PLAN). Questions: would it impress a stranger? looks like 30-min AI demo? distinctive identity? memorable hero? weakest part? what makes it 2x more impressive? architectural limits? complexity mistaken for quality? Concrete actionable fixes. No evidence-free 9/10 self-scores.

## Anti-premature-convergence (run whenever tempted to declare done)
A Time left? B Looks like 30–60 min competent dev work? C Mistaking "works" for impressive? D Really compared visual approaches? E With 4h more, what yields biggest leap? Continue while valuable; no filler work, waiting, pointless refactors or repeated tests.

## Desktop only
Desktop Chrome, mouse+keyboard, 16:9, ~1440×900 to 1920×1080. No mobile work at all. Use the big screen.

## Deployment (hard requirement)
Public URL: click -> opens -> experience begins. No downloads/clone/install/docker/localhost/terminal. Use showroom https://github.com/TheDreamersTop/grok-bot-showroom : own folder 20261019-<slug>, source+artifacts+README+demo there, keep other works, update showroom index (root README.md + index.html), GitHub Pages URL https://thedreamerstop.github.io/grok-bot-showroom/20261019-<slug>/. Don't overwrite existing works. Deploy early. Final verify: public URL works, fresh session works, no auth, no broken assets, no fatal JS errors, interactions work, refresh works, latest version deployed.

## Boundaries
May research, code, use tools, subagents, install free deps, test and deploy. Must NOT: spend money; buy services; proactively message anyone externally; publicly promote the work; modify/delete files not created by you; expose secrets/tokens/private data; destructive ops on existing repos; unrelated external operations. Public deployment and pushing to the showroom repo are allowed.

## Final acceptance
Visual: hero rendered+screenshotted; clear first-screen focal point; consistent identity; ≥3 improvement passes with comparable evidence. Interaction: start without reading long instructions; ≥3 meaningful interactions/explorable variations; no major dead ends. Technical: no fatal console errors; assets load; desktop viewport OK; acceptable performance; public deploy verified. Creative: answer "What makes this exceptional rather than merely competent?" pointing at real features.

## Final delivery (written by parent)
First line: `[OPEN THE EXPERIENCE] → public URL`, then: What I built; The Hero Moment; Evolution (Prototype → V1 → V2 → V3 → Final); Actual Work (start, end, elapsed, milestones, redesigns, validation); Known Limitations; Artifacts (URL, repo path, PLAN.md, REVIEW.md, PROGRESS.md, screenshots, source).

## Operating principle
Last time's biggest problem was declaring done too early. Don't treat the first working thing as the end. Be your own harshest critic. "When I come back in 8h, will I genuinely feel you exceeded my expectations?"

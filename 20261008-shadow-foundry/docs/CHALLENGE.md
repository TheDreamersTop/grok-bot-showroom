# Grok Overnight Challenge v3: Push the Frontier (user brief, condensed faithfully)
Start: 2026-10-08 15:24 Asia/Taipei. Budget ~8h productive work (until ~23:24 TPE). User is away; no feedback/approval.

## Mission
Autonomously create a stunning work that makes AI experts, ordinary adults and kids feel strong surprise at first sight. Topic is free. Goal: approach the highest quality you can within 8h. Autonomous creative challenge, NOT a coding speedrun.
Lessons: previous agents delivered first version in 30-60 min; functional but not stunning; only after user complained did it become impressive. Agent converged too early with low self-acceptance bar. Be your own harsh critic.

## Success definition
Immediate visual impact; Originality (not common demo/template); Interaction depth (explore, discover unexpected changes); Technical ambition (real engineering/simulation/generative/visual difficulty); Art direction (coherent, distinctive composition/color/motion/rhythm/detail); Memorability (want to reopen/share); Polish (not a prototype).
NOT: dashboard, CRUD, chat UI, report, slideshow, single-gimmick demo. Tech must serve the experience. NOTE: previous project was a cosmic particle forge (星鍛 Orbital Forge); do not repeat "pretty space with particles".

## Time budget (do not optimize for early completion)
Research+visual exploration 1h; Prototypes+concept validation 1h; Core implementation 2h; Creative rework+visual escalation 2h; Interaction+obsessive polish 1h; Final QA+deploy 1h. Each phase must produce inspectable progress. If done early, spend remaining time on highest-value improvements. If runtime/session limits exist, log them honestly; never pretend to have worked 8h.

## Persistent docs (in this folder)
PLAN.md (objectives, milestones, acceptance criteria, current state), RESEARCH.md, REVIEW.md, PROGRESS.md (append-only log), FINAL_REPORT.md.
After each milestone log: timestamp, actual elapsed, what was built, tested, failed, current quality bottleneck, next action. Checkpoint every ~45-60 min. After any context loss/handoff: FIRST reread these docs.

## Phase A: research before commitment
Study 5-10 genuinely high-quality interactive visual experiences (Awwwards, creative coding, generative art, simulations, installations, WebGL experiments, immersive storytelling). Analyze why they wow, composition, lighting/depth/motion, most memorable interaction, details beyond demo, principles to apply. Produce a concrete Visual Quality Benchmark. Clear aesthetic direction, not stacking particles/glow.

## Phase B: explore before choosing
>=5 candidate concepts (concept, hero moment, visual identity, core interaction, technical challenge, emotional impact, expansion potential, risks). Pick top 3, build actual renderable visual prototypes for each (a representative scene, a real screenshot, a core effect/interaction, short evaluation). Compare; pick the one most likely to reach exceptional. If all ordinary, re-explore, but don't stall forever.

## Define the Hero Moment before implementation
The single moment that makes someone stop, stare, say WOW: what they see, what triggers it, how the screen transforms, why surprising, how it differs from a normal WebGL demo. Must be verifiable on screen. "lots of particles / pretty universe / smooth animation" is NOT enough.

## Phase C: V1 end-to-end
Core rendering, hero moment, primary interaction, basic visual identity, navigation, deployment pipeline. Call it V1, not final. Screenshot immediately. From now on every major improvement needs before/after evidence.

## Phase D: mandatory creative escalation (most important)
Ask what a world-class creative director would criticize first (composition, originality, depth, cinematic motion, hero strength, thin interaction, side-project look). Creative destruction allowed (replace visual language, composition, hero, rendering technique, interactions, scene architecture).
At least 3 passes: Pass 1 Visual Escalation; Pass 2 Experience Escalation (surprising, engaging, memorable interaction); Pass 3 Exceptional Polish (coherence, timing, lighting, transitions, performance, immersion-breaking details). Each pass: identify biggest bottleneck, why it limits, implement meaningful improvement, before/after evidence, re-evaluate. Adding features does not count as quality.

## Independent adversarial review
Separate reviewer (Hostile Creative Director + Principal Engineer) judging ACTUAL rendered results (screenshots/video frames), not code/plan. Questions: would it impress a stranger? looks like 30-min AI demo? distinctive identity? memorable hero? weakest part? what makes it 2x more impressive? architectural limits? complexity mistaken for quality? Concrete actionable suggestions; no evidence-free 9/10.

## Anti-premature-convergence protocol (every time you want to declare done)
A Time: lots left? why stop now? B Ambition: could a competent dev make it in 30-60 min? C Visual: impressive or merely working? D Exploration: really compared approaches? E Frontier: with 4 more hours, what's the biggest leap? Continue while valuable; no filler work.

## Desktop only
Desktop Chrome, mouse+keyboard, 16:9, ~1440x900 to 1920x1080. Zero mobile work.

## Deployment (hard requirement)
Public URL: click, opens, experience begins. No downloads/clone/install/localhost.
Use showroom https://github.com/TheDreamersTop/grok-bot-showroom : new folder prefixed with start date (20261008-<slug>), source+artifacts+README+demo there, keep other works, update root README.md project table and root index.html, GitHub Pages URL https://thedreamerstop.github.io/grok-bot-showroom/<folder>/. Never overwrite existing works (20261007-orbital-forge). Other free hosting allowed if Pages unfit. Deploy EARLY to validate.
Final verify: public URL works, fresh browser session, no auth, no broken assets, no fatal JS errors, interactions work, refresh works, latest version deployed.

## Boundaries
No spending; no buying; no outbound messages; no promotion; don't modify/delete files you didn't create; don't expose secrets/tokens/private data; no destructive ops on repos (no force push); no unrelated external ops. Public deploy + pushes to the showroom repo are allowed.

## Final acceptance
Visual: hero rendered+screenshotted; clear focal point on first screen; coherent identity; >=3 improvement passes with comparable evidence.
Interaction: start without reading long instructions; >=3 meaningful interactions/explorable variations; no major dead ends.
Technical: no fatal console errors; assets load; desktop viewport OK; acceptable performance; public deployment verified.
Creative: answer "What makes this exceptional rather than merely competent?" pointing to actual features.

## Final delivery format (user-facing, Traditional Chinese)
First line: [OPEN THE EXPERIENCE] → public URL
Then: What I built; The Hero Moment (how to trigger); Evolution (Prototype→V1→V2→V3→Final, key leap each); Actual Work (start, end, actual elapsed, milestones, redesigns, validation; no inflated time); Known Limitations; Artifacts (demo URL, repo path, PLAN.md, REVIEW.md, PROGRESS.md, screenshots, source).

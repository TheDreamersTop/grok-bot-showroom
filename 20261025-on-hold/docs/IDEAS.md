# IDEAS — 2026-10-25 (started 11:11 TPE)

Design constraint I'm designing around: generated video is weak at consistency *between* shots,
strong at single evocative shots and at morphing between two given frames (first+last frame mode).
So: forms where **change between shots is the point**, and where **sound (which I fully control in code)
carries the structure and the jokes**.

## 1. YOUR CALL IS IMPORTANT TO US  (hold music through deep time)  ★ chosen
Premise: one locked-off camera. A man in a small apartment dials customer support and is put on hold.
He waits. And waits. Day/night flicker, beard, seasons, the building decays, the city outside floods,
forest, ice, desert, stars wheel — he never lets go of the phone. The hold music *evolves* across the
ages (cheap muzak → lo-fi → swelling choir → geological drone) and the robot voice keeps saying
"Your call is important to us. Your estimated wait time is … " with ever more absurd numbers.
Finally: the music stops. Silence. Click. "Hi, thanks for holding! How can I help you today?"
Ancient croak: "…I'd like to cancel my subscription." Beat. "Sure! Can I put you on hold?" — music. Black.
- Exciting: a universally-felt annoyance scaled to cosmic absurdity; "Here"-style locked camera through time, but as comedy.
- Keep watching: escalation — every cut the world is further gone; the wait-time number is a running gag/clock.
- Stays: the punchline + the closing "can I put you on hold?" loop; oddly moving image of devotion.
- Riskiest: (a) chained first/last-frame clips keep the *same composition* so it reads as one locked shot
  through time, without the model inventing camera moves; (b) voice lines sound natural enough (offline TTS).

## 2. THE LAST FRAME IS THE FIRST (infinite dive loop)
One continuous forward dive: fridge drawing → into the crayon world → a crayon city's window → a microscope slide
→ … → out through a kitchen window onto the same fridge drawing. Loops perfectly; you only notice at the end.
- Exciting: pure wonder + structural trick. Chained frames make it seamless.
- Risk: "infinite zoom" is a known genre (Powers of Ten, Zoom); continuity drift in camera speed; little story.

## 3. THE EXTRA
The same background extra appears in a western, a noir, a space opera, a kaiju film… slowly realizes he is in all of them
and starts trying to get into the foreground. Ends when he finally steps into close-up — and the film cuts.
- Exciting: meta-comedy. Risk: character consistency across genres is exactly what generated video does worst.

## 4. CIRCLE (4 billion years of match cuts)
A single circle persists across hard match cuts: cell → eye → moon → coin → vinyl → pupil → planet.
- Risk: very close to generic "cinematic montage"; the trick is old.

## 5. LOST AND FOUND (where single socks go)
A sock slides off a dryer drum and falls into the place all lost socks end up: a vast sock civilization with
lighthouses and pilgrims. Ending: one sock is reunited with its pair. Wonder + small heart.
- Risk: needs a recurring sock "character" — consistency issue; whimsy may feel Pixar-short-derivative.

## 6. SCORE (the orchestra that plays the weather)
Procedural film where a synthesized orchestra's notes trigger lightning, rain, waves (code-rendered + generated).
- Risk: abstract; hard to get a turn/ending; reads as music visualizer.

## Decision
#1. It has the strongest hook (instantly understood in 5 s), a natural escalation engine, a real punchline and a
looping coda. It converts the medium's weakness into the content: the room is *supposed* to change between shots.
The audio — music evolving through the eras, IVR voice, the silence before pickup — is fully in my control.
Test first: chained first/last-frame clips in a locked composition (2–3 clips), and whether clips carry audio.

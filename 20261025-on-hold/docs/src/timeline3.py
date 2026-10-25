# v3 edit list — single source of truth for picture + sound.
FPS = 24
YEAR = 365.25*86400
LEAD = 0.4  # black before first frame
# (clip, src_in, src_out, film_dur, kind, era)
SEQ = [
 ("v3_open.mp4",       0.0, 6.0, 6.0,  "room",  0),
 ("open.mp4",          0.0, 6.0, 7.6,  "room",  0),
 ("v3_t01.mp4",        0.0, 6.0, 3.0,  "trans", 1),
 ("v3_h1.mp4",         0.0, 5.0, 5.0,  "room",  1),
 ("v3_t12.mp4",        0.0, 6.0, 3.0,  "trans", 2),
 ("v3_h2.mp4",         0.0, 5.0, 5.0,  "room",  2),
 ("v3_t23.mp4",        0.0, 6.0, 3.0,  "trans", 3),
 ("v3_h3.mp4",         0.0, 5.0, 5.0,  "room",  3),
 ("v3_t34.mp4",        0.0, 6.0, 3.0,  "trans", 4),
 ("v3_h4.mp4",         0.0, 5.5, 5.5,  "room",  4),
 ("v3_t45.mp4",        0.0, 6.0, 3.0,  "trans", 5),
 ("v3_h5.mp4",         0.0, 5.5, 5.5,  "room",  5),
 ("v3_t56.mp4",        0.0, 6.0, 3.0,  "trans", 6),
 ("v3_h6.mp4",         0.0, 5.5, 5.5,  "room",  6),
 ("v3_t67.mp4",        0.0, 6.0, 5.0,  "trans7", 7),
 ("v3_h7.mp4",         0.0, 8.0, 8.333, "room",  7),
 ("v3_cu_hold.mp4",    0.0, 6.5, 6.5,  "cu",    7),
 ("agent_hi.mp4",      0.0, 4.3, 4.3,  "office", 8),
 ("v3_line_a.mp4",     0.7, 3.4, 2.7,  "cu",    8),
 ("v3_alex_listen.mp4",0.3, 4.3, 4.0,  "office", 8),
 ("agent_hold.mp4",    0.0, 5.3, 5.3,  "office", 8),
 ("v3_crumble_b.mp4",  0.0, 8.0, 8.0,  "room",  9),
]
SHOTS = []; _t = LEAD
for c, a, b, d, k, e in SEQ:
    SHOTS.append(dict(clip=c, a=a, b=b, start=round(_t, 4), dur=d, kind=k, era=e)); _t += d
BLACK = round(_t, 4)
END = BLACK + 4.2
def S(i): return SHOTS[i]['start']
HOLD_IDX = {0: 1, 1: 3, 2: 5, 3: 7, 4: 9, 5: 11, 6: 13, 7: 15}   # era -> hold shot index
TRANS_IDX = {1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14}
ORCH_T0 = S(14)                  # orchestra starts with the red sun rising
ORCH_CHORD = ORCH_T0 + 16*60/72  # final chord lands (beat 16 @72bpm)
PICKUP = S(17) - 0.55            # click on the man's side
REHOLD = S(21) - 0.2
CALL_T0 = S(1) + 0.45            # IVR answers -> hold timer starts
# hold-time value at the START of each hold (seconds on hold)
HOLD_AT = {1: 23*86400+4*3600+12*60, 2: 61*YEAR+117*86400, 3: 834*YEAR+52*86400, 4: 41207*YEAR+300*86400,
           5: 2318604*YEAR+77*86400, 6: 312770219*YEAR+190*86400, 7: 4903118422*YEAR+12*86400}
TOASTS = {  # shot index -> (offset, title, body)
  0:  (0.55, "Your subscription has renewed", "Premium+  ·  $9.99 / month"),
  3:  (0.45, "Price update", "Premium+ is now $14.99 / month. Thanks for being a loyal member!"),
  5:  (0.45, "Introducing Premium+ Gold", "Now $89.99 / month. Now with ads."),
  7:  (0.45, "Your subscription has renewed", "Premium+  ·  3 goats / month"),
  9:  (0.45, "Payment received", "1 mammoth tusk. Thank you!"),
  11: (0.45, "Card declined (wet)", "We charged your backup method: 40 kg of fish."),
  13: (0.45, "Payment method updated", "SAND"),
  15: (0.9,  "Payment received", "The Sun. Thank you for being a loyal member!"),
  21: (5.9,  "Cancellation request received", "Your subscription has renewed  ·  $9.99 / month"),
}
IVR = [("ivr1.wav", CALL_T0 + 0.15, "phone"), ("ivr2.wav", S(3) + 2.1, "phone"), ("ivr3.wav", S(7) + 2.4, "phone"),
       ("ivr2.wav", S(11) + 2.2, "water"), ("ivr4.wav", S(13) + 2.5, "echo"), ("ivr2.wav", BLACK + 0.85, "phone")]
if __name__ == '__main__':
    for i, s in enumerate(SHOTS): print(i, s)
    print('BLACK', BLACK, 'END', END, 'ORCH', ORCH_T0, ORCH_CHORD, 'PICKUP', PICKUP, 'REHOLD', REHOLD)

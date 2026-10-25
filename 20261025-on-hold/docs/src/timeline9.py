# v9 edit list — single source of truth for picture + sound.
FPS = 24
YEAR = 365.25*86400
LEAD = 0.4
ORCH_BPM = 76
ORCH_SKIP_BEATS = 0                  # v6: orchestra6 = bars 1-3 of the hold tune + sting at beat 12
_orch_len = 12*60/ORCH_BPM
# (clip, src_in, src_out, film_dur, kind, era)
SEQ = [
 ("v3_open.mp4",       0.0, 6.0, 6.0,  "room",  0),   # 0
 ("open.mp4",          0.0, 6.0, 6.6,  "room",  0),   # 1
 ("v3_t01.mp4",        0.0, 6.0, 3.0,  "steps", 1),   # 2  stop-motion: held frames, hard cuts
 ("v3_h1.mp4",         0.0, 3.4, 4.0,  "room",  1),   # 3  trimmed before the hand-to-face rub
 ("v3_t12.mp4",        0.0, 6.0, 3.0,  "trans", 2),   # 4
 ("v3_h2.mp4",         0.0, 4.6, 4.6,  "room",  2),   # 5
 ("v3_t23.mp4",        0.0, 6.0, 3.0,  "trans", 3),   # 6
 ("v3_h3.mp4",         0.0, 4.6, 4.6,  "room",  3),   # 7
 ("v6_t34a.mp4",       0.0, 6.0, 3.0,  "trans", 4),   # 8  ends on v6_s04 (one small distant mammoth)
 ("v6_h4a.mp4",        0.0, 2.5, 5.0,  "room",  4),   # v9: distant mammoth, half speed (slide reads as distance)   # 9  v7: mammoth walks up and peers in (legs below sill, body rocks)
 (None,                0.0, 0.0, 1.75, "stutter", 6), # 10 ice -> (ocean) -> desert, hard-cut strobe
 ("v3_h6.mp4",         0.0, 5.0, 5.0,  "room",  6),   # 11
 ("v3_t67.mp4",        0.0, 6.0, 3.5,  "trans7", 7),  # 12
 ("v3_h7.mp4",         0.0, 6.0, round(_orch_len - 3.5, 4), "room", 7),  # 13
 ("v3_cu_hold.mp4",    0.0, 5.2, 5.2,  "cu",    7),   # 14  sting + ring-out + near-silence
 ("agent_hi.mp4",      0.0, 4.3, 4.3,  "office", 8),  # 15  v9: back to the v7 take (A/B preferred)
 ("v7_ecu_a.mp4",      0.2, 3.0, 2.8,  "ecu",   8),   # 16  v7: extreme close-up, eyes + beard, mouth cropped out; his line starts here
 ("v7_ecu_a.mp4",      3.0, 5.8, 2.8,  "ecu",   8),   # 17  (same take, continuous) line finishes
 ("v7_hold_b.mp4",     0.0, 5.0, 5.0,  "office", 8),  # 18  v9: back to the v7 take (A/B preferred)
 ("v5_crumble_b.mp4",  0.6, 2.9, 2.3,  "room",  9),   # 19 wide: seated, slumps
 ("v5_cu_crumble.mp4", 1.6, 2.8, 1.2,  "cu",    9),   # 20 CU: hand turns to sand
 ("v5_crumble_b.mp4",  5.9, 8.04, 4.94, "room", 9),   # v9: pile plate (slowed) under the code transformation (fx9)   # 21 wide: bursts, dust, phone lands, settles
]
STUTTER = ["v6_s04.jpg", "v3_s05.jpg", "v3_s06.jpg"]   # background plates; man+chair fixed layer from v3_s06 (strobe5.py)
SHOTS = []; _t = LEAD
for c, a, b, d, k, e in SEQ:
    SHOTS.append(dict(clip=c, a=a, b=b, start=round(_t, 4), dur=d, kind=k, era=e)); _t += d
BLACK = round(_t, 4)
END = BLACK + 3.6
def S(i): return SHOTS[i]['start']
def E(i): return SHOTS[i]['start'] + SHOTS[i]['dur']
ERAS = [1, 2, 3, 4, 6, 7]
HOLD_IDX = {0: 1, 1: 3, 2: 5, 3: 7, 4: 9, 6: 11, 7: 13}
TRANS_IDX = {1: 2, 2: 4, 3: 6, 4: 8, 6: 10, 7: 12}
CU_HOLD, AG_HI, CU_LINE, LISTEN, AG_HOLD, CRUMBLE = 14, 15, 16, 17, 18, 19
ECU = 16   # v7: shots 16+17 are one continuous ECU of the old man
CRUMBLE_SHOTS = (19, 20, 21); CR_CU, CR_WIDE2 = 20, 21
ORCH_T0 = S(12)
ORCH_STING = ORCH_T0 + _orch_len     # == S(CU_HOLD)
PICKUP = S(AG_HI) - 0.55
REHOLD = S(CRUMBLE) + 0.1
CALL_T0 = S(1) + 0.45
HOLD_AT = {1: 23*86400+4*3600+12*60, 2: 61*YEAR+117*86400, 3: 834*YEAR+52*86400, 4: 41207*YEAR+300*86400,
           6: 312770219*YEAR+190*86400, 7: 4903118422*YEAR+12*86400}
TOASTS = {
  0:  (0.55, "Your subscription has renewed", "Premium+  ·  $9.99 / month"),
  3:  (0.4, "Price update", "Premium+ is now $14.99 / month. Thanks for being a loyal member!"),
  5:  (0.4, "Introducing Premium+ Gold", "Now $89.99 / month. Now with ads."),
  7:  (0.4, "Your subscription has renewed", "Premium+  ·  3 goats / month"),
  9:  (0.4, "Payment received", "1 mammoth tusk. Thank you!"),
  11: (0.35, "Payment method updated", "SAND"),
  12: (1.1,  "Payment received", "The Sun. Thank you for being a loyal member!"),
  13: (3.0,  "Low battery", "1% remaining. Your call is important to us."),
  21: (1.7,  "Cancellation request received", "Your subscription has renewed  ·  $9.99 / month"),
}
IVR = [("ivr1.wav", CALL_T0 + 0.15, "phone"), ("ivr2.wav", S(3) + 2.0, "phone"), ("ivr3.wav", S(7) + 2.3, "phone"),
       ("ivr4.wav", S(11) + 2.4, "echo"), ("ivr2.wav", BLACK + 0.35, "phone")]
if __name__ == '__main__':
    for i, s in enumerate(SHOTS): print(i, round(s['start'],2), s['dur'], s['clip'], s['kind'])
    print('BLACK', BLACK, 'END', END, 'ORCH', ORCH_T0, ORCH_STING, 'PICKUP', PICKUP, 'REHOLD', REHOLD)

LAND = 3.667   # v8: impact frame of the phone in v5_crumble_b (src time), measured frame by frame

CR_A_SRC = 2.85   # v9: figure frame for the transformation
TAU_LAND = 0.38   # v9: phone lands when the sand front passes it

# Shared timeline (film seconds). Edit here; both picture and sound read it.
FPS = 24
# (clip, src_in, src_out, film_start)
SHOTS = [
    ("open.mp4",       0.0, 6.0, 1.6),
    ("m01.mp4",        0.0, 8.0, 7.6),
    ("m12.mp4",        0.0, 8.0, 15.6),
    ("m23.mp4",        0.0, 8.0, 23.6),
    ("m34.mp4",        0.0, 8.0, 31.6),
    ("m45.mp4",        0.0, 8.0, 39.6),
    ("m56.mp4",        0.0, 8.0, 47.6),
    ("m67.mp4",        0.0, 8.0, 55.6),
    ("speak.mp4",      0.0, 2.6, 63.6),
    ("agent_hi.mp4",   0.0, 4.4, 66.2),
    ("speak.mp4",      2.6, 6.8, 70.6),
    ("agent_hold.mp4", 0.0, 5.4, 74.8),
    ("crumble.mp4",    0.0, 8.0, 80.2),
]
END = 96.0
BLACK_START = 88.2
MUSIC_T0 = 8.3        # hold music begins
MUSIC_CUT = 63.6      # hard cut to silence
PICKUP_CLICK = 65.8
REHOLD = 80.0         # "can I put you on hold" -> music again
# clips whose own audio we keep (dialogue)
DIALOGUE = {("agent_hi.mp4", 66.2), ("speak.mp4", 70.6), ("agent_hold.mp4", 74.8)}
# hold-time map: (film t, hold seconds)  log-interpolated
YEAR = 365.25*86400
HOLD_MAP = [(1.6, 0.0), (7.6, 9.0), (15.6, 23*86400), (23.6, 61*YEAR), (31.6, 830*YEAR),
            (39.6, 41000*YEAR), (47.6, 2.3e6*YEAR), (55.6, 310e6*YEAR), (63.6, 4.9e9*YEAR)]

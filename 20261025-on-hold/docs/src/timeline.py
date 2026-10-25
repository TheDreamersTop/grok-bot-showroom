# Shared timeline v2 (film seconds). Edit here; picture + sound read it.
FPS = 24
# (clip, src_in, src_out, film_start, film_dur)  speed = (src_out-src_in)/film_dur
_seq = [("open.mp4", 0, 6.0, 6.0), ("m01.mp4", 0, 8, 8.0), ("m12.mp4", 0, 8, 7.0), ("m23.mp4", 0, 8, 6.0),
        ("m34.mp4", 0, 8, 5.5), ("m45.mp4", 0, 8, 5.5), ("m56.mp4", 0, 8, 5.5), ("m67b.mp4", 0, 8, 8.0),
        ("speak_b.mp4", 0, 2.5, 2.5), ("agent_hi.mp4", 0, 4.4, 4.4), ("speak_b.mp4", 2.5, 6.8, 4.3),
        ("agent_hold.mp4", 0, 5.4, 5.4), ("crumble_b.mp4", 0, 8, 8.0)]
SHOTS = []; _t = 1.6
for c, a, b, d in _seq:
    SHOTS.append((c, a, b, round(_t, 3), d)); _t += d
S = {f"{c}@{i}": s for i, (c, *_r) in enumerate(_seq) for s in [SHOTS[i]]}
st = lambda i: SHOTS[i][3]
E = dict(open=st(0), weeks=st(1), decades=st(2), jungle=st(3), ice=st(4), ocean=st(5), desert=st(6), red=st(7),
         cut=st(8), agent1=st(9), speak=st(10), agent2=st(11), crumble=st(12), black=st(12)+8.0)
MUSIC_T0 = 8.3
MUSIC_CUT = E['cut']
PICKUP_CLICK = E['agent1'] - 0.4
REHOLD = E['crumble'] - 0.2
BLACK_START = E['black']
STINGER = BLACK_START + 3.6     # IVR "estimated wait time... four minutes" over black
END = BLACK_START + 7.6
DIALOGUE = {(SHOTS[9][0], SHOTS[9][3]), (SHOTS[10][0], SHOTS[10][3]), (SHOTS[11][0], SHOTS[11][3])}
YEAR = 365.25*86400
HOLD_MAP = [(1.6, 0.0), (E['weeks'], 9.0), (E['decades'], 23*86400), (E['jungle'], 61*YEAR), (E['ice'], 830*YEAR),
            (E['ocean'], 41000*YEAR), (E['desert'], 2.3e6*YEAR), (E['red'], 310e6*YEAR), (E['cut'], 4.9e9*YEAR)]
if __name__ == '__main__':
    for s in SHOTS: print(s)
    print(E, END)

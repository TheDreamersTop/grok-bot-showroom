"""Hold-music arrangements: one tune (F major, 8 bars), many costumes. MIDI via mido -> FluidR3_GM via fluidsynth."""
import mido, subprocess, os, random
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio', 'music'); os.makedirs(OUT, exist_ok=True)
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
TPB = 480
random.seed(3)
# melody: per bar list of (beat, dur, midi)
MEL = [[(0,1,69),(1,.5,72),(1.5,1.5,76),(3,1,74)],
       [(0,.5,74),(.5,.5,72),(1,1,70),(2,2,67)],
       [(0,1,72),(1,.5,69),(1.5,1.5,72),(3,1,77)],
       [(0,1.5,76),(1.5,.5,74),(2,2,72)],
       [(0,1,69),(1,.5,72),(1.5,1.5,76),(3,1,74)],
       [(0,.5,74),(.5,.5,76),(1,1,77),(2,2,81)],
       [(0,1,79),(1,.5,77),(1.5,1.5,74),(3,1,72)],
       [(0,4,77)]]
# jazz chords per bar: list of (beat, dur, root, voicing)
J = {'Fmaj7':(41,[53,57,60,64]), 'Gm7':(43,[53,58,62,67]), 'C7':(36,[52,58,60,64]), 'Am7':(45,[55,57,60,64]),
     'Dm7':(38,[53,57,60,62]), 'Bbmaj7':(46,[53,57,58,62]), 'F6':(41,[53,57,60,62]), 'C9':(36,[52,58,62,64])}
JAZZ = [[(0,4,'Fmaj7')],[(0,2,'Gm7'),(2,2,'C9')],[(0,2,'Am7'),(2,2,'Dm7')],[(0,4,'C7')],
        [(0,4,'Fmaj7')],[(0,4,'Bbmaj7')],[(0,2,'Gm7'),(2,2,'C7')],[(0,4,'F6')]]
# plain triads for the orchestra (no clashes)
T = {'F':(41,[53,57,60]), 'Gm':(43,[55,58,62]), 'C':(36,[55,60,64]), 'Am':(45,[57,60,64]), 'Dm':(38,[57,62,65]),
     'Bb':(46,[58,62,65]), 'C7':(36,[55,58,64])}
TRI = [[(0,4,'F')],[(0,2,'Gm'),(2,2,'C')],[(0,2,'Am'),(2,2,'Dm')],[(0,2,'C'),(2,2,'C7')],
       [(0,4,'F')],[(0,4,'Bb')],[(0,2,'Gm'),(2,2,'C')],[(0,4,'F')]]

class Song:
    def __init__(self, bpm):
        self.mid = mido.MidiFile(ticks_per_beat=TPB); self.ev = {}; self.bpm = bpm; self.progs = {}
    def prog(self, ch, p, vol=100, pan=64, rev=40, cho=0):
        self.progs[ch] = (p, vol, pan, rev, cho)
    def note(self, ch, beat, dur, n, vel):
        vel = max(1, min(127, int(vel + random.uniform(-6, 6))))
        b = beat + random.uniform(0, 0.012)
        self.ev.setdefault(ch, []).append((int(b*TPB), 1, n, vel)); self.ev[ch].append((int((b+dur)*TPB), 0, n, 0))
    def cc(self, ch, beat, ctl, val): self.ev.setdefault(ch, []).append((int(beat*TPB), 2, ctl, val))
    def write(self, path):
        tr0 = mido.MidiTrack(); tr0.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm))); self.mid.tracks.append(tr0)
        for ch, evs in self.ev.items():
            tr = mido.MidiTrack(); p, vol, pan, rev, cho = self.progs.get(ch, (0,100,64,40,0))
            if ch != 9: tr.append(mido.Message('program_change', channel=ch, program=p))
            for c, v in [(7,vol),(10,pan),(91,rev),(93,cho)]: tr.append(mido.Message('control_change', channel=ch, control=c, value=v))
            evs.sort(key=lambda e: (e[0], e[1] != 0)); last = 0
            for t, kind, a, b in evs:
                dt = max(0, t-last); last = t
                if kind == 1: tr.append(mido.Message('note_on', channel=ch, note=a, velocity=b, time=dt))
                elif kind == 0: tr.append(mido.Message('note_off', channel=ch, note=a, velocity=0, time=dt))
                else: tr.append(mido.Message('control_change', channel=ch, control=a, value=b, time=dt))
            self.mid.tracks.append(tr)
        self.mid.save(path)

def chords(song, ch, bars, table, prog, pattern, vel, octave=0, bar0=0):
    for i in range(bars):
        bar = (bar0+i) % 8
        for cb, cd, name in prog[bar]:
            _, voi = table[name]
            for o, d in pattern:
                if cb <= o < cb+cd:
                    for n in voi: song.note(ch, i*4+o, d, n+octave, vel)
def bassline(song, ch, bars, table, prog, vel, octave=0, style='bossa'):
    for i in range(bars):
        for cb, cd, name in prog[i % 8]:
            r = table[name][0] + octave
            if style == 'bossa':
                if cd == 4: seq = [(0,1.4,r),(1.5,.5,r+7),(2,1.4,r+7),(3.5,.5,r)]
                else: seq = [(0,1.4,r),(1.5,.45,r+7)]
            elif style == 'root':
                seq = [(0, cd*0.95, r)]
            else:  # two-feel
                seq = [(0, cd/2*0.9, r), (cd/2, cd/2*0.9, r+7 if cd == 4 else r)]
            for o, d, n in seq: song.note(ch, i*4+cb+o, d, n, vel)
def melody(song, ch, bars, vel, octave=0, legato=0.95, bar0=0):
    for i in range(bars):
        for o, d, n in MEL[(bar0+i) % 8]:
            song.note(ch, i*4+o, d*legato, n+octave, vel + (8 if o == 0 else 0))
def drums_bossa(song, bars, vel=70):
    for i in range(bars):
        B = i*4
        for o in ([0,1.5,3] if i % 2 == 0 else [1,2.5]): song.note(9, B+o, .1, 37, vel)     # side stick clave
        for o in [x*0.5 for x in range(8)]: song.note(9, B+o, .1, 82 if o % 1 == 0 else 70, vel-25 + (8 if o % 1 else 0))  # shaker/maracas
        for o in [0, 2]: song.note(9, B+o, .1, 36, vel-15)
        for o in [1.5, 3.5]: song.note(9, B+o, .1, 36, vel-35)

def render(song, name, gain=0.5):
    mp = os.path.join(OUT, name + '.mid'); wp = os.path.join(OUT, name + '.wav')
    song.write(mp)
    subprocess.run(['fluidsynth', '-ni', '-q', '-g', str(gain), '-r', '48000', '-R', '1', '-C', '1', '-F', wp, SF2, mp], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return wp

BARS = 10
def lounge():
    s = Song(100)
    s.prog(0, 73, 100, 64, 50, 20)   # flute lead
    s.prog(1, 11, 70, 80, 50, 30)    # vibraphone double
    s.prog(2, 4, 85, 50, 40, 40)     # rhodes
    s.prog(3, 24, 80, 75, 35, 0)     # nylon guitar
    s.prog(4, 32, 110, 64, 10, 0)    # acoustic bass
    s.prog(9, 0, 90, 64, 30, 0)
    melody(s, 0, BARS, 88); melody(s, 1, BARS, 55, legato=0.6)
    chords(s, 2, BARS, J, JAZZ, [(0,1.2),(1.5,.5),(2.5,1.0)], 58)
    chords(s, 3, BARS, J, JAZZ, [(0.5,.4),(1,.4),(2,.4),(3,.4)], 52)
    bassline(s, 4, BARS, J, JAZZ, 95, octave=0)
    drums_bossa(s, BARS)
    return render(s, 'lounge')
def tropical():
    s = Song(104)
    s.prog(0, 12, 115, 64, 40, 0)    # marimba lead
    s.prog(1, 114, 85, 90, 50, 0)    # steel drums
    s.prog(3, 24, 75, 40, 35, 0)
    s.prog(4, 32, 105, 64, 10, 0)
    s.prog(9, 0, 95, 64, 30, 0)
    melody(s, 0, BARS, 100, legato=0.5); melody(s, 1, BARS, 70, octave=-12, legato=0.5)
    chords(s, 3, BARS, J, JAZZ, [(0.5,.3),(1,.3),(1.5,.3),(2.5,.3),(3,.3),(3.5,.3)], 50)
    bassline(s, 4, BARS, J, JAZZ, 95)
    for i in range(BARS):
        B = i*4
        for o, n in [(0,63),(0.5,62),(1,64),(1.5,63),(2,63),(2.5,62),(3,64),(3.5,62)]: s.note(9, B+o, .1, n, 70)  # congas
        for o in [x*0.5 for x in range(8)]: s.note(9, B+o, .1, 69, 45)   # cabasa
        for o in [0, 1.5, 3]: s.note(9, B+o, .1, 75, 60)                 # claves
    return render(s, 'tropical')
def musicbox():
    s = Song(84)
    s.prog(0, 10, 115, 64, 70, 0)    # music box
    s.prog(1, 8, 75, 40, 70, 0)      # celesta arps
    s.prog(2, 49, 55, 64, 90, 40)    # soft strings
    s.prog(3, 9, 50, 90, 80, 0)      # glock
    melody(s, 0, BARS, 95, legato=0.9); melody(s, 3, BARS, 55, octave=12, legato=0.4)
    for i in range(BARS):
        for cb, cd, name in JAZZ[i % 8]:
            voi = J[name][1]
            for k in range(int(cd*2)):
                s.note(1, i*4+cb+k*0.5, 0.45, voi[k % 4]+12, 50)
    chords(s, 2, BARS, T, TRI, [(0,3.9),(2,1.9)], 45)
    return render(s, 'musicbox')
def western():
    s = Song(88)
    s.prog(0, 78, 105, 64, 80, 0)    # whistle
    s.prog(3, 24, 90, 50, 60, 0)     # guitar arps
    s.prog(4, 33, 85, 64, 30, 0)     # fingered bass
    s.prog(5, 14, 55, 80, 100, 0)    # tubular bell on downbeats
    melody(s, 0, BARS, 92, legato=0.9)
    for i in range(BARS):
        for cb, cd, name in TRI[i % 8]:
            r, voi = T[name]
            arp = [r+12, voi[0], voi[1], voi[2], voi[1], voi[0]]
            for k in range(int(cd*1.5)):
                s.note(3, i*4+cb+k*(2/3), 0.6, arp[k % 6], 70)
        s.note(5, i*4, 2, 65 if i % 2 == 0 else 60, 60)
    bassline(s, 4, BARS, T, TRI, 80, style='root')
    return render(s, 'western')
def orchestra():
    s = Song(72)
    s.prog(0, 60, 110, 54, 70, 0)    # french horns: melody
    s.prog(1, 48, 105, 74, 80, 0)    # strings: melody 8va
    s.prog(2, 48, 95, 64, 90, 0)     # strings: chords
    s.prog(3, 52, 90, 64, 100, 0)    # choir aahs
    s.prog(4, 43, 105, 64, 60, 0)    # contrabass
    s.prog(5, 61, 85, 70, 70, 0)     # brass section
    s.prog(6, 47, 110, 64, 60, 0)    # timpani
    s.prog(7, 56, 85, 60, 70, 0)     # trumpet
    s.prog(9, 0, 90, 64, 80, 0)
    for i in range(4):
        bar = 4 + i
        for o, d, n in MEL[bar]:
            s.note(0, i*4+o, d*0.98, n-12, 80 + i*8)
            s.note(1, i*4+o, d*0.98, n, 74 + i*10)
            if i >= 1: s.note(7, i*4+o, d*0.95, n, 66 + i*10)
        for cb, cd, name in TRI[bar]:
            r, voi = T[name]
            for n in voi: s.note(2, i*4+cb, cd, n, 66 + i*10)
            for n in voi: s.note(3, i*4+cb, cd, n, 56 + i*10)
            s.note(4, i*4+cb, cd, r, 90)
            if i >= 1:
                for n in voi[:2]: s.note(5, i*4+cb, cd*0.9, n-12, 60 + i*12)
        r0 = T[TRI[bar][0][2]][0]
        s.note(6, i*4, 1, r0 if r0 >= 41 else r0+12, 90 + i*8)
    s.note(9, 0, 2, 49, 95)
    for k in range(16): s.note(6, 12 + k*0.25, 0.25, 48, 60 + k*3)
    F = 16
    for n in [53,57,60,65,69,72]: s.note(2, F, 6, n, 112); s.note(3, F, 6, n, 104)
    for n in [65, 69, 72, 77]: s.note(1, F, 6, n, 112)
    for n in [53, 60]: s.note(0, F, 6, n, 112)
    for n in [53, 57, 60]: s.note(5, F, 6, n, 104)
    s.note(7, F, 6, 77, 104); s.note(4, F, 6, 29, 112); s.note(4, F, 6, 41, 104)
    s.note(6, F, 1, 41, 127); s.note(9, F, 3, 49, 120); s.note(9, F, 3, 57, 110)
    return render(s, 'orchestra', gain=0.25)

if __name__ == '__main__':
    for f in (lounge, tropical, musicbox, western, orchestra): print(f())

# ---- v4: clean fanfare orchestra (REVIEW-02 fix 4) ----
MEL4 = [[(0,1,69),(1,.5,72),(1.5,1.5,77),(3,1,74)],
        [(0,.5,74),(.5,.5,76),(1,1,77),(2,2,81)],
        [(0,1,79),(1,.5,77),(1.5,1.5,74),(3,1,72)],
        [(0,4,77)]]
CH4 = [[(0,3,'F'),(3,1,'Bb')], [(0,2,'Dm'),(2,2,'F')], [(0,3,'Gm'),(3,1,'C')], [(0,4,'F')]]
T4 = {'F':(41,[60,65,69]), 'Bb':(46,[58,62,65]), 'Dm':(38,[57,62,65]), 'Gm':(43,[58,62,67]), 'C':(36,[60,64,67])}
def orchestra4(bpm=72):
    random.seed(4)
    s = Song(bpm)
    s.prog(0, 56, 112, 60, 35, 0)    # trumpet melody
    s.prog(1, 48, 95, 72, 40, 0)     # strings melody 8va
    s.prog(2, 60, 92, 50, 40, 0)     # french horns: sustained triads (mid, open)
    s.prog(3, 48, 80, 64, 40, 0)     # strings: triads
    s.prog(4, 43, 95, 64, 30, 0)     # contrabass roots only
    s.prog(5, 9, 70, 80, 40, 0)      # glockenspiel sparkle
    s.prog(6, 47, 105, 64, 35, 0)    # timpani
    s.prog(9, 0, 95, 64, 45, 0)
    for i in range(4):
        for o, d, n in MEL4[i]:
            s.note(0, i*4+o, d*0.92, n, 100 + i*6 + (6 if o == 0 else 0))
            s.note(1, i*4+o, d*0.95, n+12, 70 + i*6)
            if i < 3: s.note(5, i*4+o, 0.3, n+12, 55)
        for cb, cd, name in CH4[i]:
            r, voi = T4[name]
            for n in voi: s.note(2, i*4+cb, cd*0.97, n, 70 + i*6)
            for n in voi: s.note(3, i*4+cb, cd*0.97, n-12 if n-12 >= 53 else n, 58 + i*6)
            s.note(4, i*4+cb, cd*0.9, r, 92)
        if i < 3: s.note(6, i*4, 0.9, 41 if CH4[i][0][2] in ('F','Dm') else 43, 96)
    for k in range(8): s.note(6, 14 + k*0.25, 0.25, 48, 64 + k*7)    # short roll into the sting
    s.note(9, 15.5, 0.5, 38, 70); s.note(9, 15.75, 0.25, 38, 90)      # snare pickup
    F = 16   # the sting: short tutti hit, then let it ring
    for n in [72, 77, 81]: s.note(0, F, 0.7, n, 124)
    for n in [65, 69, 72, 77, 81, 84]: s.note(1, F, 1.2, n, 118)
    for n in [60, 65, 69]: s.note(2, F, 0.9, n, 116)
    s.note(4, F, 1.0, 29, 118); s.note(4, F, 1.0, 41, 110)
    s.note(6, F, 1.5, 41, 127); s.note(9, F, 2, 49, 118); s.note(9, F, 1, 36, 120); s.note(5, F, 1, 89, 90)
    return render(s, 'orchestra4', gain=0.3)

# byte-music-converter
Convert Byte music to MIDI, WAV, or MP3.

<a href="https://clyp.it/u40dl3tr">Here's what it sounds like.</a>

### Status

Works well, but needs cleanup. Here's what's remaining:

- Allow command line import of any Byte post or Byte music object
- Add command line arg for loop count
- Error handling
- Tests

### Setup

Byte Music Converter requires <a href="http://www.fluidsynth.org">FluidSynth</a> (with libsndfile) and <a href="http://lame.sourceforge.net">LAME</a>. 

```
$ brew install fluid-synth --with-libsndfile
$ brew install lame
```

Then, to run:
```
$ npm install
$ ./index.js
```

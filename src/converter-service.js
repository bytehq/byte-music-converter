var exec = require('co-exec');
var fs = require('co-fs');
var midi = require('jsmidgen');

var storageService = require('./storage-service');


var outputDir = './out/';

var tracks = [
    "bleep",
    "meow",
    "bass",
    "ping",
    "string",
    "reso",
    "arp",
    "bark",
    "mono1",
    "mono2",
    "mono3",
    "funk",
    "sax",
    "bell",
    "roboto",
    /*"do",*/
    "drums"
];

var notes = [
    "A/-1", "A#/-1", "B/-1", "C/0", "C#/0", "D/0", "D#/0", "E/0", "F/0", "F#/0", "G/0", "G#/0",
    "A/0", "A#/0", "B/0", "C/1", "C#/1", "D/1", "D#/1", "E/1", "F/1", "F#/1", "G/1", "G#/1",
    "A/1", "A#/1", "B/1", "C/2", "C#/2", "D/2", "D#/2", "E/2", "F/2", "F#/2", "G/2", "G#/2",
    "A/2", "A#/2", "B/2", "C/3", "C#/3", "D/3", "D#/3", "E/3", "F/3", "F#/3", "G/3", "G#/3",
    "A/3", "A#/3", "B/3", "C/4", "C#/4", "D/4", "D#/4", "E/4", "F/4", "F#/4", "G/4", "G#/4",
    "A/4", "A#/4", "B/4", "C/5", "C#/5", "D/5", "D#/5", "E/5", "F/5", "F#/5", "G/5", "G#/5",
    "A/5", "A#/5", "B/5", "C/6", "C#/6", "D/6", "D#/6", "E/6", "F/6", "F#/6", "G/6", "G#/6",
    "A/6", "A#/6", "B/6", "C/7", "C#/7", "D/7", "D#/7", "E/7", "F/7", "F#/7", "G/7", "G#/7",
    "A/7", "A#/7", "B/7", "C/8", "C#/8", "D/8", "D#/8", "E/8", "F/8", "F#/8", "G/8"
];

var drums = [
    "Kick",
    "Snare",
    "Clap",
    "Hat",
    "Thump",
    "Glitch",
    "Tambourine",
    "Whistle",
    "Block",
    "Stick",
    "Shaker",
    "Crash",
    "Tom",
    "Conga",
    "Cowbell",
    "Yeah"
];

var trackIndex = function (trackName) {
    return tracks.indexOf(trackName);
};

var note = function (note) {
    return notes.indexOf(note) + 21;
};

var drumNote = function (drum) {
    return drums.indexOf(drum) + 36;
};


var populateMidiFile = function (music) {
    var file = new midi.File();
    var midiTracks = [];

    for (var i = 0; i < tracks.length; ++i) {
        var track = file.addTrack();
        midiTracks.push(track);
    }

    for (var j = 0; j < tracks.length; ++j) {
        midiTracks[0].setInstrument(j, j === 15 ? 127 : j);
        midiTracks[0].setTempo(music.bpm, 0);
    }

    var instructions = [];
    // Loop until 30s
    var numLoops = Math.ceil(music.bpm / (music.length * 2));
    for (var n = 0; n < numLoops; ++n) {
        for (var k = 0; k < music.instructions.length; ++k) {
            var beat = music.instructions[k];

            for (var l = 0; l < beat.length; ++l) {
                var beatInstruction = beat[l];
                var offset = parseInt(128 * (beatInstruction.time + (n * music.length)));
                var midiNote;
                if (beatInstruction.type === 0) {
                    midiNote = note(beatInstruction.note);
                } else {
                    midiNote = drumNote(beatInstruction.note);
                }
                instructions.push({
                    velocity: beatInstruction.velo,
                    offset: offset,
                    note: midiNote,
                    track: trackIndex(beatInstruction.bank)
                });
            }
        }
    }

    instructions = instructions.sort(function (a, b) {
        return a.offset - b.offset;
    });

    var currentOffset = 0;

    for (var m = 0; m < instructions.length; ++m) {
        var instruction = instructions[m];
        var delay = 0;
        if (instruction.offset > currentOffset) {
            delay = instruction.offset - currentOffset;
            currentOffset = instruction.offset;
        }

        midiTracks[0].addNoteOn(instruction.track, instruction.note, delay, instruction.velocity);
    }

    return file;
};


var convert = function* (name, music) {
    var outputDirExists = yield fs.exists(outputDir);
    if (!outputDirExists) fs.mkdir(outputDir);

    var file = populateMidiFile(music);

    var errorState;
    try {
        yield fs.writeFile(outputDir + name + '.mid', file.toBytes(), 'binary');
        yield exec('fluidsynth --gain 2.0 -F ' + outputDir + name + '.wav ./resources/Byte.sf2 ' + outputDir + name + '.mid');
        yield exec('lame -V 6 --vbr-new ' + outputDir + name + '.wav ' + outputDir + name + '.mp3');
        yield storageService.uploadFile(outputDir + name + '.mp3');
    } catch (err) {
        errorState = err;
    }

    try {
        yield fs.unlink(outputDir + name + '.mid');
        yield fs.unlink(outputDir + name + '.wav');
        yield fs.unlink(outputDir + name + '.mp3');
    } catch (err) {
        if (!errorState) logger.errorLogger.log(err);
    }

    if (errorState) throw errorState;

    return storageService.getPublicUrl(name + '.mp3');
};


module.exports = {
    convert: convert
};

(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';

  var bpm = 92;
  var bars = 46;
  var sections = [
    { name: 'intro', startBar: 0, bars: 4 },
    { name: 'a', startBar: 4, bars: 12 },
    { name: 'b', startBar: 16, bars: 12 },
    { name: 'c', startBar: 28, bars: 12 },
    { name: 'outro', startBar: 40, bars: 6 }
  ];
  var chordSets = {
    intro: [[53,57,60,64],[55,58,62,65],[48,52,55,58],[53,57,60,64]],
    a: [[53,57,60,64],[52,57,60,64],[55,58,62,65],[48,52,55,58]],
    b: [[50,53,57,60],[55,58,62,65],[58,62,65,69],[48,52,55,58]],
    c: [[57,60,64,67],[50,54,57,60],[55,58,62,65],[48,52,55,58]],
    outro: [[58,62,65,69],[59,62,65,68],[48,52,55,58],[57,60,64,67],[55,58,62,65],[48,52,55,58]]
  };
  var phrases = {
    intro: [[0,72,2],[2.5,69,1]],
    a: [[0.5,69,.5],[1,72,1],[2.5,74,.5],[3,76,.75]],
    b: [[0,77,.75],[1,76,.5],[1.75,72,.75],[3,69,.75]],
    c: [[0,76,.5],[.75,79,.5],[1.5,81,1],[3,77,.75]],
    outro: [[0,74,1],[1.5,72,.5],[2.5,69,1]]
  };
  var roots = { intro: [41,43,36,41], a: [41,40,43,36], b: [38,43,46,36], c: [45,38,43,36], outro: [46,47,36,45,43,36] };
  var chords = [];
  var melody = [];
  var bass = [];
  var drums = [];

  sections.forEach(function(section) {
    var set = chordSets[section.name];
    var phrase = phrases[section.name];
    var rootNotes = roots[section.name];
    for (var offset = 0; offset < section.bars; offset += 1) {
      var bar = section.startBar + offset;
      var chord = set[offset % set.length].slice();
      if (offset >= set.length && offset % 2 === 1) chord = chord.map(function(note, index) { return index === 0 ? note + 12 : note; });
      chords.push({ bar: bar, beat: 0, notes: chord, beats: 3.8, velocity: section.name === 'intro' ? .32 : .42 });
      bass.push({ bar: bar, beat: 0, note: rootNotes[offset % rootNotes.length], beats: 1.5, velocity: .48 });
      bass.push({ bar: bar, beat: 2.5, note: rootNotes[offset % rootNotes.length] + (offset % 3 === 2 ? 7 : 12), beats: 1, velocity: .32 });

      phrase.forEach(function(item, phraseIndex) {
        if ((offset + phraseIndex) % 7 === 6) return;
        var variation = offset % 4 === 3 ? -2 : (offset >= 8 ? 2 : 0);
        melody.push({ bar: bar, beat: item[0], note: item[1] + variation, beats: item[2], velocity: .48 + (phraseIndex % 2) * .08 });
      });

      if (section.name !== 'intro' || offset >= 2) {
        drums.push({ bar: bar, beat: 0, kind: 'kick', velocity: .42 });
        drums.push({ bar: bar, beat: 2, kind: 'kick', velocity: .3 });
        drums.push({ bar: bar, beat: 1, kind: 'brush', velocity: .3 });
        drums.push({ bar: bar, beat: 3, kind: 'brush', velocity: .36 });
        if (section.name === 'c' || offset % 2 === 1) {
          drums.push({ bar: bar, beat: 1.5, kind: 'hat', velocity: .18 });
          drums.push({ bar: bar, beat: 3.5, kind: 'hat', velocity: .2 });
        }
      }
    }
  });

  var LO_FI_SCORE = {
    bpm: bpm,
    bars: bars,
    durationSeconds: bars * 4 * 60 / bpm,
    sections: sections,
    chords: chords,
    melody: melody,
    bass: bass,
    drums: drums
  };
  return { LO_FI_SCORE: LO_FI_SCORE };
});

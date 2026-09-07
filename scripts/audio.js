(function(root) {
  'use strict';
  var M = root.MBB;
  var score = M.LO_FI_SCORE;
  var context = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var schedulerTimer = null;
  var scheduledNodes = [];
  var nextBar = 0;
  var nextBarTime = 0;
  var enabled = true;
  var beatSeconds = 60 / score.bpm;
  var barSeconds = beatSeconds * 4;
  var musicLevel = 0.18;

  function isSupported() {
    return Boolean(root.AudioContext || root.webkitAudioContext);
  }

  function createMix() {
    if (masterGain) return;
    masterGain = context.createGain();
    musicGain = context.createGain();
    sfxGain = context.createGain();
    masterGain.gain.value = 0.72;
    musicGain.gain.value = musicLevel;
    sfxGain.gain.value = 0.48;
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(context.destination);
  }

  function getContext() {
    var AudioContext = root.AudioContext || root.webkitAudioContext;
    if (!AudioContext) return null;
    if (!context) {
      context = new AudioContext();
      createMix();
    }
    return context;
  }

  function midiFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function envelope(gain, start, peak, attack, release) {
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + release);
  }

  function rememberNode(node) {
    scheduledNodes.push(node);
    node.onended = function() {
      var index = scheduledNodes.indexOf(node);
      if (index >= 0) scheduledNodes.splice(index, 1);
    };
  }

  function stopScheduledNodes() {
    var nodes = scheduledNodes.slice();
    scheduledNodes.length = 0;
    nodes.forEach(function(node) {
      node.onended = null;
      try { node.stop(0); } catch (error) { return; }
    });
  }

  function oscillatorNote(note, start, duration, type, volume, destination, detune) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(midiFrequency(note), start);
    oscillator.detune.value = detune || 0;
    envelope(gain, start, volume, Math.min(.04, duration / 4), duration);
    oscillator.connect(gain);
    gain.connect(destination);
    rememberNode(oscillator);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  function playChord(event, barStart) {
    var start = barStart + event.beat * beatSeconds;
    var duration = event.beats * beatSeconds;
    var filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    filter.Q.value = .7;
    filter.connect(musicGain);
    event.notes.forEach(function(note, index) {
      oscillatorNote(note, start + index * .012, duration, 'triangle', .045 * event.velocity, filter, index % 2 ? -4 : 4);
      oscillatorNote(note + 12, start + index * .012, duration * .75, 'sine', .018 * event.velocity, filter, 0);
    });
  }

  function playPluck(event, barStart) {
    var start = barStart + event.beat * beatSeconds;
    var duration = Math.max(.12, event.beats * beatSeconds * .75);
    oscillatorNote(event.note, start, duration, 'sine', .16 * event.velocity, musicGain, 0);
    oscillatorNote(event.note + 12, start, duration * .45, 'triangle', .055 * event.velocity, musicGain, 7);
  }

  function playBass(event, barStart) {
    var start = barStart + event.beat * beatSeconds;
    var duration = event.beats * beatSeconds;
    oscillatorNote(event.note, start, duration, 'triangle', .12 * event.velocity, musicGain, 0);
    oscillatorNote(event.note - 12, start, duration * .8, 'sine', .08 * event.velocity, musicGain, 0);
  }

  function noiseBuffer(duration) {
    var frames = Math.max(1, Math.floor(context.sampleRate * duration));
    var buffer = context.createBuffer(1, frames, context.sampleRate);
    var data = buffer.getChannelData(0);
    for (var index = 0; index < frames; index += 1) data[index] = Math.random() * 2 - 1;
    return buffer;
  }

  function playDrum(event, barStart) {
    var start = barStart + event.beat * beatSeconds;
    if (event.kind === 'kick') {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(110, start);
      oscillator.frequency.exponentialRampToValueAtTime(48, start + .14);
      envelope(gain, start, .24 * event.velocity, .005, .18);
      oscillator.connect(gain);
      gain.connect(musicGain);
      rememberNode(oscillator);
      oscillator.start(start);
      oscillator.stop(start + .2);
      return;
    }
    var source = context.createBufferSource();
    var noiseGain = context.createGain();
    var filter = context.createBiquadFilter();
    var duration = event.kind === 'brush' ? .2 : .07;
    source.buffer = noiseBuffer(duration);
    filter.type = event.kind === 'brush' ? 'bandpass' : 'highpass';
    filter.frequency.value = event.kind === 'brush' ? 1800 : 5200;
    envelope(noiseGain, start, .09 * event.velocity, .005, duration);
    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(musicGain);
    rememberNode(source);
    source.start(start);
  }

  function scheduleLayer(layer, barIndex, startTime, player) {
    layer.forEach(function(event) {
      if (event.bar === barIndex) player(event, startTime);
    });
  }

  function scheduleBar(barIndex, startTime) {
    scheduleLayer(score.chords, barIndex, startTime, playChord);
    scheduleLayer(score.melody, barIndex, startTime, playPluck);
    scheduleLayer(score.bass, barIndex, startTime, playBass);
    scheduleLayer(score.drums, barIndex, startTime, playDrum);
  }

  function scheduler() {
    while (nextBarTime < context.currentTime + barSeconds * 2) {
      scheduleBar(nextBar, nextBarTime);
      nextBar = (nextBar + 1) % score.bars;
      nextBarTime += barSeconds;
    }
  }

  function beginScheduler() {
    if (schedulerTimer) return;
    nextBar = 0;
    nextBarTime = context.currentTime + .06;
    musicGain.gain.cancelScheduledValues(context.currentTime);
    musicGain.gain.setValueAtTime(musicLevel, context.currentTime);
    scheduler();
    schedulerTimer = root.setInterval(scheduler, 250);
  }

  function startMusic() {
    enabled = true;
    if (!getContext()) return Promise.resolve(false);
    var resumed = context.state === 'suspended' ? context.resume() : Promise.resolve();
    return Promise.resolve(resumed).then(function() {
      if (context.state === 'running') {
        beginScheduler();
        return true;
      }
      return false;
    }).catch(function() { return false; });
  }

  function stopMusic() {
    enabled = false;
    if (schedulerTimer) root.clearInterval(schedulerTimer);
    schedulerTimer = null;
    stopScheduledNodes();
    if (musicGain && context) {
      musicGain.gain.cancelScheduledValues(context.currentTime);
      musicGain.gain.setTargetAtTime(.0001, context.currentTime, .03);
    }
  }

  function toggle() {
    if (enabled && schedulerTimer) {
      stopMusic();
      return Promise.resolve(false);
    }
    return startMusic();
  }

  function duck(seconds) {
    if (!musicGain || !context || !enabled) return;
    var now = context.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(Math.max(.0001, musicGain.gain.value), now);
    musicGain.gain.linearRampToValueAtTime(musicLevel * .35, now + .04);
    musicGain.gain.setValueAtTime(musicLevel * .35, now + seconds);
    musicGain.gain.linearRampToValueAtTime(musicLevel, now + seconds + .35);
  }

  function cue(notes, spacing, duration, type) {
    if (!enabled || !getContext()) return;
    duck(notes.length * spacing + duration);
    notes.forEach(function(note, index) {
      oscillatorNote(note, context.currentTime + index * spacing, duration, type, .18, sfxGain, 0);
    });
  }

  function playChoice() { cue([64, 71], .07, .11, 'triangle'); }
  function playReview() { cue([50, 49, 48], .35, .28, 'sawtooth'); }
  function playPromotion() { cue([60, 64, 67, 72, 76], .09, .22, 'triangle'); }
  function playFailure() { cue([62, 57, 53, 48], .13, .25, 'sawtooth'); }

  M.audio = {
    startMusic: startMusic,
    stopMusic: stopMusic,
    toggle: toggle,
    duck: duck,
    isSupported: isSupported,
    playChoice: playChoice,
    playReview: playReview,
    playPromotion: playPromotion,
    playFailure: playFailure,
    getState: function() { return context ? context.state : 'uninitialized'; }
  };
})(window);

// Copyright 2014 Alan deLespinasse
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

var reverbIR;
var reverbFilename;
var audioContext;
var masterGain;
var convolver;
var dryGain;
var wetGain;
var demoSource = null;
var demoSourceBuffers = {};

function makeAudioContext() {
  if (audioContext) {
    return;
  }
  try {
    audioContext = new AudioContext();
  } catch (e) {
    alert("This browser doesn't support the Web Audio API standard. Try the latest version of Chrome or Firefox.");
    return;
  }
  document.getElementById('sampleRate').value = audioContext.sampleRate;

  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.5;
  convolver = audioContext.createConvolver();
  dryGain = audioContext.createGain();
  wetGain = audioContext.createGain();
  masterGain.connect(dryGain);
  masterGain.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(audioContext.destination);
  wetGain.connect(audioContext.destination);
  changeDemoMix();
}

function doGenerateReverb() {
  document.getElementById('playSection').style.display = 'none';
  var params = {
    fadeInTime: Number(document.getElementById('fadeInTime').value),
    decayTime: Number(document.getElementById('decayTime').value),
    sampleRate: Number(document.getElementById('sampleRate').value),
    lpFreqStart: Number(document.getElementById('lpFreqStart').value),
    lpFreqEnd: Number(document.getElementById('lpFreqEnd').value),
    numChannels: 2            // TODO: let user specify
  };
  reverbFilename = ('reverb' + params.fadeInTime + '-' + params.decayTime + '-' +
                    params.lpFreqStart + '-' + params.lpFreqEnd).replace(/\./g, '_') + '.wav';
  reverbGen.generateReverb(params, function(result) {
    reverbIR = result;
    document.getElementById('playSection').style.display = 'block';
    var feedbackDiv = document.getElementById('feedbackSection');
    feedbackDiv.innerHTML = '';
    feedbackDiv.appendChild(reverbGen.generateGraph(reverbIR.getChannelData(0), 400, 150, -1, 1));
    try {
      convolver.buffer = reverbIR;
    } catch(e) {
      alert("There was an error creating the convolver, probably because you chose " +
            "a sample rate that doesn't match your browser's playback (" + audioContext.sampleRate +
            "). Playing the demo sounds through your impulse response may not work, " +
            "but you should be able to play and/or save the impulse response. Error message: " + e);
      convolver.buffer = audioContext.createBuffer(params.numChannels, 1, audioContext.sampleRate);
    }

    // if (lpFreqStart) {
    //   feedbackDiv.appendChild(document.createElement('br'));
    //   feedbackDiv.appendChild(document.createTextNode('Lowpass response at end: '));

    //   var freqBins = sampleRate / 100;
    //   var frequencyHz = new Float32Array(freqBins);
    //   for (var i = 0; i < freqBins; i++) {
    //     frequencyHz[i] = (i+1) * 50;
    //   }
    //   var magResponse = new Float32Array(freqBins);
    //   var phaseResponse = new Float32Array(freqBins);
    //   window.filterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
    //   var graph = reverbGen.generateGraph(magResponse, freqBins, 200, 0, 1.1);
    //   feedbackDiv.appendChild(graph);
    // }
  });
}

function playReverb() {
  var node = audioContext.createBufferSource();
  node.buffer = reverbIR;
  node.connect(audioContext.destination);
  node.start();
}

function saveReverb() {
  reverbGen.saveWavFile(reverbIR, reverbFilename, 5);
}

function toggleDemoSource() {
  changeDemoSource();
}

function changeDemoSource() {
  if (demoSource) {
    demoSource.stop();
    demoSource = null;
  }
  if (document.getElementById('toggleDemoSource').checked) {
    initDemoSource();
  }
}

function initDemoSource() {
  var demoSourceSelector = document.getElementById('demoSourceSelector');
  var demoSourceName = demoSourceSelector.value;
  loadDemoSource(demoSourceName, function(buffer) {
    demoSource = audioContext.createBufferSource();
    demoSource.buffer =  buffer;
    demoSource.loop = true;
    demoSource.loopEnd = buffer.duration;
    demoSource.connect(masterGain);
    demoSource.start();
  });
}

function loadDemoSource(name, callback) {
  if (demoSourceBuffers[name]) {
    callback(demoSourceBuffers[name]);
    return;
  }

  var loadingDiv = document.getElementById('demoSourceLoading');
  loadingDiv.style.display = 'block';

  var request = new XMLHttpRequest();
  var url = 'drysounds/' + name + '.wav';
  request.open('GET', url);
  request.responseType = 'arraybuffer';

  request.onerror = function() {
    alert('Failed to load ' + url + ': ' + request.status + ' ' + request.statusText);
    loadingDiv.style.display = 'none';
  };

  request.onload = function() {
    if (request.status >= 400) {
      request.onerror();
      return;
    }

    loadingDiv.style.display = 'none';
    audioContext.decodeAudioData(request.response, function(buffer) {
      demoSourceBuffers[name] = buffer;
      callback(buffer);
    }, function() {
      alert('Failed to decode audio file ' + url);
    });
  };
  request.send();
}

function changeDemoMix() {
  var slider = document.getElementById('demoMix');
  var wetDbLevel = Number(slider.value);
  var wetLevel = wetDbLevel == Number(slider.min) ? 0 :
    Math.pow(10, wetDbLevel / 20);
  var dryLevel = Math.sqrt(1 - wetLevel * wetLevel);
  dryGain.gain.value = dryLevel;
  wetGain.gain.value = wetLevel;
}

var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
          datasets: [{
              label: '# of Votes',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
  });

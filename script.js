let mediaRecorder;
let audioChunks = [];
let audioContext, gainNode;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const player = document.getElementById('player');

startBtn.onclick = async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];

  // Setup Web Audio
  audioContext = new AudioContext();
  const sourceNode = audioContext.createMediaStreamSource(stream);
  gainNode = audioContext.createGain();
  const destination = audioContext.createMediaStreamDestination();

  sourceNode.connect(gainNode);
  gainNode.connect(destination);

  // ANALISI: Regola il gain se l'audio è troppo basso
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  gainNode.connect(analyser);

  function monitorVolume() {
    analyser.getByteTimeDomainData(dataArray);
    const rms = Math.sqrt(
      dataArray.reduce((sum, val) => sum + Math.pow((val - 128) / 128, 2), 0) / dataArray.length
    );
    if (rms < 0.05) {
      gainNode.gain.value = 2.0;
    } else {
      gainNode.gain.value = 1.0;
    }
    requestAnimationFrame(monitorVolume);
  }
  monitorVolume();

  // Usa l'audio manipolato (amplificato) per la registrazione
  mediaRecorder = new MediaRecorder(destination.stream);
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    player.src = audioUrl;
  };

  mediaRecorder.start();
};

stopBtn.onclick = () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  mediaRecorder.stop();
  audioContext.close();
};


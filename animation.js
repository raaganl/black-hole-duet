const video = document.getElementById('video');

let smoothVel = 0;
let stopped = false;
let selectedPort = null;

// --- AUDIO ---
let audioCtx = null;
let audioBuffer = null;
let audioSource = null;
let gainNode = null;
let lastAudioPos = 0;
let lastAudioStart = 0;

async function initAudio() {
    if (audioCtx) return;
    audioCtx = new AudioContext();

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 1.0;
    gainNode.connect(audioCtx.destination);

    // fetch and decode the video's audio track separately
    const response = await fetch('output3.mp4');
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    console.log('audio loaded, duration:', audioBuffer.duration);
}

function playAudioAt(position, rate) {
    if (!audioCtx || !audioBuffer) return;

    // stop current source
    if (audioSource) {
        try { audioSource.stop(); } catch {}
        audioSource = null;
    }

    if (Math.abs(rate) < 0.01) return; // too slow, don't play

    // clamp position
    position = Math.max(0, Math.min(audioBuffer.duration, position));

    audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.playbackRate.value = Math.abs(rate); // rate controls speed
    audioSource.connect(gainNode);
    audioSource.start(0, position);

    lastAudioPos = position;
    lastAudioStart = audioCtx.currentTime;
}

function stopAudio() {
    if (audioSource) {
        try { audioSource.stop(); } catch {}
        audioSource = null;
    }
}

// --- CONNECT BUTTON ---
const btn = document.createElement('button');
btn.innerText = 'Connect Dial';
btn.style.cssText = 'position:fixed; top:20px; left:20px; z-index:999; padding:10px 20px; font-size:16px; cursor:pointer; background:white;';
document.body.appendChild(btn);

btn.addEventListener('click', async () => {
    selectedPort = await navigator.serial.requestPort();
    navigator.wakeLock.request('screen').catch(err => console.log(err));
    await initAudio();
    connectSerial();
});

async function connectSerial() {
    try {
        try { await selectedPort.close(); } catch {}
        await selectedPort.open({ baudRate: 115200 });

        btn.innerText = 'Dial Connected';
        btn.style.background = 'green';
        btn.style.color = 'white';

        const decoder = new TextDecoderStream();
        selectedPort.readable.pipeTo(decoder.writable);
        const reader = decoder.readable.getReader();

        let buffer = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                parseLine(line.trim());
            }
        }

    } catch (err) {
        console.log('disconnected:', err);
    } finally {
        btn.innerText = 'Reconnecting...';
        btn.style.background = 'orange';
        try { await selectedPort.close(); } catch {}
        setTimeout(() => connectSerial(), 2000);
    }
}

function parseLine(line) {
    if (line.startsWith('VEL:')) {
        const val = parseFloat(line.replace('VEL:', ''));
        if (!isNaN(val)) {
            smoothVel = val;
            stopped = true;
        }
    }
    if (line.includes('STATE: RUNNING')) {
        stopped = false;
        smoothVel = 0;
    }
}

let lastScrubVel = 0;
let audioRestartTimer = 0;

function tick() {
    requestAnimationFrame(tick);

    if (stopped) {
        video.pause();

        const rate = smoothVel * 0.01;
        const scrubAmount = smoothVel * 0.0002;

        // scrub video visually
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + scrubAmount));

        // restart audio every 300ms at current position so it stays in sync
        // without this the audio buffer would keep playing from where it started
        const now = audioCtx ? audioCtx.currentTime : 0;
        if (audioCtx && (Math.abs(smoothVel - lastScrubVel) > 2 || now - audioRestartTimer > 0.3)) {
            playAudioAt(video.currentTime, rate);
            audioRestartTimer = now;
            lastScrubVel = smoothVel;
        }

    } else {
        // motor running — stop separate audio, let video play normally
        stopAudio();
        video.playbackRate = 1.0;
        if (video.paused) video.play();
    }
}

requestAnimationFrame(tick);
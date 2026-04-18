const video = document.getElementById('video');

let smoothVel = 0;
let stopped = false;

// --- CONNECT BUTTON ---
const btn = document.createElement('button');
btn.innerText = 'Connect Dial';
btn.style.cssText = 'position:fixed; top:20px; left:20px; z-index:999; padding:10px 20px; font-size:16px; cursor:pointer; background:white;';
document.body.appendChild(btn);

btn.addEventListener('click', async () => {
    selectedPort = await navigator.serial.requestPort();
    connectSerial();
});

async function connectSerial() {
    try {
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
        console.log('disconnected, retrying in 2s...', err);
    } finally {
        btn.innerText = 'Reconnecting...';
        btn.style.background = 'orange';
        try { await selectedPort.close(); } catch {}
        setTimeout(async () => {
            await connectSerial();
        }, 2000);
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

function tick() {
    requestAnimationFrame(tick);

    if (stopped) {
        video.pause();
        const scrubAmount = smoothVel * 0.0002;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + scrubAmount));
    } else {
        if (video.paused) video.play();
    }
}

requestAnimationFrame(tick);
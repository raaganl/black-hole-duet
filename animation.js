const video = document.getElementById('video');

let smoothVel = 0;

// --- CONNECT BUTTON ---
const btn = document.createElement('button');
btn.innerText = 'Connect Dial';
btn.style.cssText = 'position:fixed; top:20px; left:20px; z-index:999; padding:10px 20px; font-size:16px; cursor:pointer; background:white;';
document.body.appendChild(btn);

btn.addEventListener('click', async () => {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    btn.innerText = 'Dial Connected';
    btn.style.background = 'green';
    btn.style.color = 'white';

    // read serial lines continuously
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
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
});

// --- PARSE SERIAL OUTPUT ---
// reads VEL: lines from ESP32 when motor is in stopped/touched state
function parseLine(line) {
    if (line.startsWith('VEL:')) {
        const val = parseFloat(line.replace('VEL:', ''));
        if (!isNaN(val)) {
            smoothVel = val;
        }
    }
}

// --- MAIN LOOP ---
function tick() {
    requestAnimationFrame(tick);

    if (smoothVel === 0) return;

    // scale velocity to scrub speed — tune this number up or down
    const scrubAmount = smoothVel * 0.0002;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + scrubAmount));
}

requestAnimationFrame(tick);

/*
const video = document.getElementById('video');
const FPS = 20;


let seekDirection = null;


function stepFrame() {
    if (!seekDirection) return;
    if (seekDirection === 'backward') {
        video.currentTime = Math.max(0, video.currentTime - 1 / FPS);
    } else if (seekDirection === 'forward') {
        video.currentTime += 1 / FPS;
    }
}


video.onseeked = function() {
    if (seekDirection) stepFrame();
};


document.onkeydown = function(event) {
    if (event.repeat) return;
    if (event.key === "ArrowLeft") { seekDirection = 'backward'; stepFrame(); }
    else if (event.key === "ArrowRight") { seekDirection = 'forward'; stepFrame(); }
};


document.onkeyup = function(event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        seekDirection = null;
        video.play();
    }
};


*/
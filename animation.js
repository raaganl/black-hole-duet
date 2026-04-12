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
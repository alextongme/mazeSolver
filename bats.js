(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.getElementById("bat-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BAT_COUNT = 10;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawBat(ctx, wingspan, flapPhase) {
        const half = wingspan / 2;
        const bw = wingspan * 0.06;
        const bh = wingspan * 0.12;
        const earH = wingspan * 0.055;
        const amplitude = wingspan * 0.22;
        const tipY = -(amplitude * Math.cos(flapPhase * Math.PI * 2));
        const dip = wingspan * 0.035;

        const s1x = half * 0.72, s1y = tipY * 0.65;
        const s2x = half * 0.45, s2y = tipY * 0.35;
        const s3x = half * 0.22, s3y = tipY * 0.12;

        ctx.beginPath();
        ctx.moveTo(-half, tipY);
        ctx.quadraticCurveTo(-half * 0.45, tipY * 0.5 - bh * 0.5, -bw, -bh * 0.4);
        ctx.lineTo(-bw * 0.7, -(bh + earH));
        ctx.lineTo(-bw * 0.15, -bh * 0.6);
        ctx.lineTo(bw * 0.15, -bh * 0.6);
        ctx.lineTo(bw * 0.7, -(bh + earH));
        ctx.lineTo(bw, -bh * 0.4);
        ctx.quadraticCurveTo(half * 0.45, tipY * 0.5 - bh * 0.5, half, tipY);
        ctx.quadraticCurveTo((half + s1x) / 2, (tipY + s1y) / 2 + dip * 1.5, s1x, s1y + dip);
        ctx.quadraticCurveTo((s1x + s2x) / 2, (s1y + s2y) / 2 + dip * 1.5, s2x, s2y + dip);
        ctx.quadraticCurveTo((s2x + s3x) / 2, (s2y + s3y) / 2 + dip * 1.5, s3x, s3y + dip);
        ctx.quadraticCurveTo((s3x + bw) / 2, bh * 0.5 + dip, bw * 0.5, bh);
        ctx.quadraticCurveTo(0, bh * 1.2, -bw * 0.5, bh);
        ctx.quadraticCurveTo(-(s3x + bw) / 2, bh * 0.5 + dip, -s3x, s3y + dip);
        ctx.quadraticCurveTo(-(s2x + s3x) / 2, (s2y + s3y) / 2 + dip * 1.5, -s2x, s2y + dip);
        ctx.quadraticCurveTo(-(s1x + s2x) / 2, (s1y + s2y) / 2 + dip * 1.5, -s1x, s1y + dip);
        ctx.quadraticCurveTo(-(half + s1x) / 2, (tipY + s1y) / 2 + dip * 1.5, -half, tipY);
        ctx.closePath();
    }

    function createBat(w, h, index) {
        const goRight = Math.random() > 0.5;
        const wingspan = 25 + Math.random() * 45;
        const depthFactor = (wingspan - 25) / 45;

        return {
            startX: goRight ? -(wingspan + Math.random() * 60) : w + wingspan + Math.random() * 60,
            endX: goRight ? w + wingspan + Math.random() * 60 : -(wingspan + Math.random() * 60),
            startY: Math.random() * h * 0.8 + h * 0.05,
            endY: Math.random() * h * 0.8 + h * 0.05,
            cp1: { x: goRight ? w * (0.15 + Math.random() * 0.3) : w * (0.55 + Math.random() * 0.3), y: Math.random() * h },
            cp2: { x: goRight ? w * (0.55 + Math.random() * 0.3) : w * (0.15 + Math.random() * 0.3), y: Math.random() * h },
            wingspan: wingspan,
            maxOpacity: 0.12 + Math.random() * 0.1 + depthFactor * 0.13,
            flapDuration: 200 + (1 - depthFactor) * 300,
            flapOffset: Math.random() * 1000,
            flightDuration: 14000 + Math.random() * 12000,
            startDelay: index * (2000 + Math.random() * 3000),
            baseAngle: (Math.random() - 0.5) * 0.25,
            wobbleSpeed: 0.001 + Math.random() * 0.002,
            wobbleAmount: 0.03 + Math.random() * 0.06,
            scaleMin: 0.92 + Math.random() * 0.05,
            scaleMax: 1.02 + Math.random() * 0.06,
            scaleDuration: 4000 + Math.random() * 6000,
            bobAmount: wingspan * (0.05 + Math.random() * 0.1),
            bobSpeed: 0.0015 + Math.random() * 0.002,
        };
    }

    function bezier(t, sx, sy, c1x, c1y, c2x, c2y, ex, ey) {
        const u = 1 - t;
        return {
            x: u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
            y: u * u * u * sy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey,
        };
    }

    var bats = [];
    var batStartTimes = new Array(BAT_COUNT).fill(null);
    var batWaiting = [];

    for (var i = 0; i < BAT_COUNT; i++) {
        bats.push(createBat(canvas.width, canvas.height, i));
        batWaiting.push(bats[i].startDelay);
    }

    var globalStart = null;

    function animate(time) {
        if (!globalStart) globalStart = time;
        var globalElapsed = time - globalStart;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < bats.length; i++) {
            var bat = bats[i];

            if (batWaiting[i] > 0) {
                if (globalElapsed < batWaiting[i]) continue;
                batStartTimes[i] = time;
                batWaiting[i] = 0;
            }

            if (batStartTimes[i] === null) continue;

            var elapsed = time - batStartTimes[i];
            var t = Math.min(elapsed / bat.flightDuration, 1);

            var fade;
            if (t < 0.1) fade = t / 0.1;
            else if (t > 0.9) fade = (1 - t) / 0.1;
            else fade = 1;

            var pos = bezier(
                t, bat.startX, bat.startY,
                bat.cp1.x, bat.cp1.y, bat.cp2.x, bat.cp2.y,
                bat.endX, bat.endY
            );

            var flapPhase = ((elapsed + bat.flapOffset) % bat.flapDuration) / bat.flapDuration;
            var bob = Math.sin(elapsed * bat.bobSpeed) * bat.bobAmount;
            var wobble = Math.sin(elapsed * bat.wobbleSpeed) * bat.wobbleAmount;
            var scaleT = (Math.sin(elapsed / bat.scaleDuration * Math.PI * 2) + 1) / 2;
            var scale = bat.scaleMin + (bat.scaleMax - bat.scaleMin) * scaleT;

            ctx.save();
            ctx.translate(pos.x, pos.y + bob);
            ctx.rotate(bat.baseAngle + wobble);
            ctx.scale(scale, scale);
            ctx.globalAlpha = fade * bat.maxOpacity;
            ctx.fillStyle = "#6272a4";

            drawBat(ctx, bat.wingspan, flapPhase);
            ctx.fill();
            ctx.restore();

            if (t >= 1) {
                var delay = 15000 + Math.random() * 25000;
                batStartTimes[i] = null;
                batWaiting[i] = globalElapsed + delay;
                bats[i] = createBat(canvas.width, canvas.height, i);
                bats[i].startDelay = 0;
            }
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
})();

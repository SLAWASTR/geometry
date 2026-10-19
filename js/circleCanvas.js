/**
 * Touch-enabled Retina Canvas for Trigonometric Circle
 * Автор: @slawastr 1-26 design
 */

class CircleCanvas {
    constructor(canvasElement, onAngleChange) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.onAngleChange = onAngleChange;
        this.isDragging = false;
        this.result = null;

        this.initEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(rect.width, rect.height || rect.width);
        
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;

        this.ctx.resetTransform?.();
        this.ctx.scale(dpr, dpr);
        this.logicalSize = size;
        this.render();
    }

    initEvents() {
        const getAngleFromEvent = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const x = clientX - rect.left - this.logicalSize / 2;
            const y = -(clientY - rect.top - this.logicalSize / 2); // invert Y

            let rad = Math.atan2(y, x);
            if (rad < 0) rad += 2 * Math.PI;
            return (rad * 180.0) / Math.PI;
        };

        const handleStart = (e) => {
            this.isDragging = true;
            const deg = getAngleFromEvent(e);
            this.onAngleChange?.(deg);
            e.preventDefault();
        };

        const handleMove = (e) => {
            if (!this.isDragging) return;
            const deg = getAngleFromEvent(e);
            this.onAngleChange?.(deg);
            e.preventDefault();
        };

        const handleEnd = () => {
            this.isDragging = false;
        };

        this.canvas.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        this.canvas.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('touchcancel', handleEnd);
    }

    setResult(result) {
        this.result = result;
        this.render();
    }

    render() {
        if (!this.ctx || !this.logicalSize) return;

        const ctx = this.ctx;
        const size = this.logicalSize;
        const center = size / 2;
        const radius = size * 0.35;

        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.clearRect(0, 0, size, size);

        // 1. Highlight Quadrant
        if (this.result && this.result.isValid && !this.result.quadrant.isAxis) {
            this.drawQuadrantHighlight(ctx, center, radius, this.result.quadrant.number, isDark);
        }

        // 2. Unit Circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Subdivision Ticks
        this.drawSubdivisions(ctx, center, radius, isDark);

        // 4. Coordinate Axes
        this.drawAxes(ctx, center, radius, size, isDark);

        if (!this.result || !this.result.isValid) return;

        // 5. Rotation Arc / Spiral
        this.drawRotationArcOrSpiral(ctx, center, radius, this.result.degrees, isDark);

        // 6. Projections to Axes
        this.drawProjections(ctx, center, radius, this.result.normalizedDegrees);

        // 7. Terminal Ray
        this.drawTerminalRay(ctx, center, radius, this.result.normalizedDegrees);
    }

    drawQuadrantHighlight(ctx, center, radius, qNum, isDark) {
        let startAngle = 0;
        let endAngle = 0;
        if (qNum === 1) { startAngle = 0; endAngle = Math.PI / 2; }
        else if (qNum === 2) { startAngle = Math.PI / 2; endAngle = Math.PI; }
        else if (qNum === 3) { startAngle = Math.PI; endAngle = 3 * Math.PI / 2; }
        else if (qNum === 4) { startAngle = 3 * Math.PI / 2; endAngle = 2 * Math.PI; }

        ctx.beginPath();
        ctx.moveTo(center, center);
        // Canvas angles increase clockwise, cartesian counter-clockwise
        ctx.arc(center, center, radius, -startAngle, -endAngle, true);
        ctx.closePath();
        ctx.fillStyle = isDark ? 'rgba(10, 132, 255, 0.22)' : 'rgba(0, 122, 255, 0.12)';
        ctx.fill();
    }

    drawSubdivisions(ctx, center, radius, isDark) {
        const specialAngles = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
        for (let deg of specialAngles) {
            const rad = (deg * Math.PI) / 180.0;
            const is45 = deg % 90 === 45;
            const tickLen = is45 ? 8 : 5;

            const xOuter = center + radius * Math.cos(rad);
            const yOuter = center - radius * Math.sin(rad);

            const xInner = center + (radius - tickLen) * Math.cos(rad);
            const yInner = center - (radius - tickLen) * Math.sin(rad);

            ctx.beginPath();
            ctx.moveTo(xInner, yInner);
            ctx.addLine(xOuter, yOuter);
            ctx.strokeStyle = is45 ? 'rgba(255, 149, 0, 0.65)' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)');
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    drawAxes(ctx, center, radius, size, isDark) {
        const axisColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
        const axisLength = radius * 1.25;
        const arrowSize = 7;

        // X Axis
        ctx.beginPath();
        ctx.moveTo(center - axisLength, center);
        ctx.lineTo(center + axisLength, center);
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // X Arrow
        ctx.beginPath();
        ctx.moveTo(center + axisLength, center);
        ctx.lineTo(center + axisLength - arrowSize, center - arrowSize * 0.5);
        ctx.lineTo(center + axisLength - arrowSize, center + arrowSize * 0.5);
        ctx.closePath();
        ctx.fillStyle = axisColor;
        ctx.fill();

        // Y Axis
        ctx.beginPath();
        ctx.moveTo(center, center + axisLength);
        ctx.lineTo(center, center - axisLength);
        ctx.stroke();

        // Y Arrow
        ctx.beginPath();
        ctx.moveTo(center, center - axisLength);
        ctx.lineTo(center - arrowSize * 0.5, center - axisLength + arrowSize);
        ctx.lineTo(center + arrowSize * 0.5, center - axisLength + arrowSize);
        ctx.closePath();
        ctx.fill();

        // Center dot
        ctx.beginPath();
        ctx.arc(center, center, 3, 0, 2 * Math.PI);
        ctx.fillStyle = axisColor;
        ctx.fill();

        // Labels X & Y
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = axisColor;
        ctx.fillText('X (cos)', center + axisLength - 10, center + 16);
        ctx.fillText('Y (sin)', center - 40, center - axisLength + 10);

        // Main Axis Ticks
        const tickLen = 8;
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? '#fff' : '#000';

        // 0 / 360
        ctx.beginPath();
        ctx.moveTo(center + radius, center - tickLen / 2);
        ctx.lineTo(center + radius, center + tickLen / 2);
        ctx.stroke();

        // 90
        ctx.beginPath();
        ctx.moveTo(center - tickLen / 2, center - radius);
        ctx.lineTo(center + tickLen / 2, center - radius);
        ctx.stroke();

        // 180
        ctx.beginPath();
        ctx.moveTo(center - radius, center - tickLen / 2);
        ctx.lineTo(center - radius, center + tickLen / 2);
        ctx.stroke();

        // 270
        ctx.beginPath();
        ctx.moveTo(center - tickLen / 2, center + radius);
        ctx.lineTo(center + tickLen / 2, center + radius);
        ctx.stroke();
    }

    drawRotationArcOrSpiral(ctx, center, radius, totalDegrees, isDark) {
        if (Math.abs(totalDegrees) < 0.5) return;

        const isPositive = totalDegrees >= 0;
        const arcBaseRadius = radius * 0.42;

        if (Math.abs(totalDegrees) <= 360) {
            ctx.beginPath();
            // Canvas arc is clockwise
            ctx.arc(center, center, arcBaseRadius, 0, -((totalDegrees * Math.PI) / 180.0), isPositive);
            ctx.strokeStyle = isPositive ? '#007aff' : '#ff3b30';
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.stroke();

            this.drawArcArrow(ctx, center, arcBaseRadius, totalDegrees, isPositive);
        } else {
            // Archimedean spiral for angles up to 5000°
            const totalRad = (Math.abs(totalDegrees) * Math.PI) / 180.0;
            const totalTurns = totalRad / (2 * Math.PI);

            const minR = radius * 0.18;
            const maxR = radius * 0.58;

            const visualTurns = Math.min(totalTurns, 5.0);
            const visualDegrees = visualTurns * 360.0;
            const steps = Math.floor(visualDegrees / 3.0) + 1;

            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const currentDeg = i * 3.0 * (isPositive ? 1.0 : -1.0);
                const t = i / steps;
                const currentRad = (currentDeg * Math.PI) / 180.0;
                const currentR = minR + t * (maxR - minR);

                const x = center + currentR * Math.cos(currentRad);
                const y = center - currentR * Math.sin(currentRad);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            const spiralColor = isPositive ? '#007aff' : '#ff3b30';
            ctx.strokeStyle = spiralColor;
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.stroke();

            this.drawArcArrow(ctx, center, maxR, totalDegrees, isPositive);

            // Turn Counter Badge
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = spiralColor;
            ctx.textAlign = 'center';
            const revText = `${isPositive ? '+' : '−'}${(Math.abs(totalDegrees) / 360.0).toFixed(1)} об.`;
            ctx.fillText(revText, center, center + radius * 0.28);
            ctx.textAlign = 'start';
        }
    }

    drawArcArrow(ctx, center, r, degree, isPositive) {
        const mathRad = (degree * Math.PI) / 180.0;
        const tipX = center + r * Math.cos(mathRad);
        const tipY = center - r * Math.sin(mathRad);

        const tangentAngle = mathRad + (isPositive ? Math.PI / 2 : -Math.PI / 2);
        const arrowLen = 8;
        const arrowSpread = Math.PI / 6;

        const p1 = {
            x: tipX - arrowLen * Math.cos(tangentAngle - arrowSpread),
            y: tipY + arrowLen * Math.sin(tangentAngle - arrowSpread)
        };
        const p2 = {
            x: tipX - arrowLen * Math.cos(tangentAngle + arrowSpread),
            y: tipY + arrowLen * Math.sin(tangentAngle + arrowSpread)
        };

        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();
        ctx.fillStyle = isPositive ? '#007aff' : '#ff3b30';
        ctx.fill();
    }

    drawProjections(ctx, center, radius, normDeg) {
        const rad = (normDeg * Math.PI) / 180.0;
        const targetX = center + radius * Math.cos(rad);
        const targetY = center - radius * Math.sin(rad);

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        // Proj to X
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX, center);
        ctx.strokeStyle = 'rgba(88, 86, 214, 0.7)';
        ctx.stroke();

        // Proj to Y
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(center, targetY);
        ctx.strokeStyle = 'rgba(52, 199, 89, 0.7)';
        ctx.stroke();

        ctx.restore();
    }

    drawTerminalRay(ctx, center, radius, normDeg) {
        const rad = (normDeg * Math.PI) / 180.0;
        const targetX = center + radius * Math.cos(rad);
        const targetY = center - radius * Math.sin(rad);

        // Ray
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = '#ff9500';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Endpoint glow
        ctx.beginPath();
        ctx.arc(targetX, targetY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 149, 0, 0.35)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff9500';
        ctx.fill();
    }
}

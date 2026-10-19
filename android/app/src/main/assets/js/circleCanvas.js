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
        this.logicalSize = 340;

        this.initEvents();
        this.resize();

        // Responsive resize listener
        window.addEventListener('resize', () => this.resize());
        if (window.ResizeObserver && this.canvas.parentElement) {
            new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
        }
    }

    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const parentW = rect.width > 0 ? rect.width : 340;
        
        // Desktop window or mobile container constraint
        let size = Math.floor(Math.min(parentW - 20, 420));
        if (size < 260) size = 260;

        this.canvas.width = Math.round(size * dpr);
        this.canvas.height = Math.round(size * dpr);
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
            const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
            const x = clientX - rect.left - this.logicalSize / 2;
            const y = -(clientY - rect.top - this.logicalSize / 2); // invert Y for cartesian

            let rad = Math.atan2(y, x);
            if (rad < 0) rad += 2 * Math.PI;
            return (rad * 180.0) / Math.PI;
        };

        const handleStart = (e) => {
            this.isDragging = true;
            const deg = getAngleFromEvent(e);
            this.onAngleChange?.(deg);
            if (e.cancelable && e.type.startsWith('touch')) {
                e.preventDefault();
            }
        };

        const handleMove = (e) => {
            if (!this.isDragging) return;
            const deg = getAngleFromEvent(e);
            this.onAngleChange?.(deg);
            if (e.cancelable && e.type.startsWith('touch')) {
                e.preventDefault();
            }
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

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
            (!document.documentElement.getAttribute('data-theme') &&
             window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

        ctx.clearRect(0, 0, size, size);

        // 1. Highlight Quadrant
        if (this.result && this.result.isValid && !this.result.quadrant.isAxis) {
            this.drawQuadrantHighlight(ctx, center, radius, this.result.quadrant.number, isDark);
        }

        // 2. Unit Circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Roman Quadrant Labels
        this.drawQuadrantWatermarks(ctx, center, radius, isDark);

        // 4. Subdivision Ticks and Labels
        this.drawSubdivisions(ctx, center, radius, isDark);

        // 5. Coordinate Axes with Arrows and Labels
        this.drawAxes(ctx, center, radius, size, isDark);

        if (!this.result || !this.result.isValid) return;

        // 6. Rotation Arc or Spiral
        this.drawRotationArcOrSpiral(ctx, center, radius, this.result.degrees, isDark);

        // 7. Projections to Axes
        this.drawProjections(ctx, center, radius, this.result.normalizedDegrees, isDark);

        // 8. Terminal Ray
        this.drawTerminalRay(ctx, center, radius, this.result.normalizedDegrees);
    }

    drawQuadrantWatermarks(ctx, center, radius, isDark) {
        const dist = radius * 0.65;
        const fontColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
        ctx.save();
        ctx.font = '700 18px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // I
        ctx.fillText('I', center + dist * 0.7, center - dist * 0.7);
        // II
        ctx.fillText('II', center - dist * 0.7, center - dist * 0.7);
        // III
        ctx.fillText('III', center - dist * 0.7, center + dist * 0.7);
        // IV
        ctx.fillText('IV', center + dist * 0.7, center + dist * 0.7);

        ctx.restore();
    }

    drawQuadrantHighlight(ctx, center, radius, qNum, isDark) {
        let startAngle = 0;
        let endAngle = 0;
        if (qNum === 1) { startAngle = 0; endAngle = Math.PI / 2; }
        else if (qNum === 2) { startAngle = Math.PI / 2; endAngle = Math.PI; }
        else if (qNum === 3) { startAngle = Math.PI; endAngle = 3 * Math.PI / 2; }
        else if (qNum === 4) { startAngle = 3 * Math.PI / 2; endAngle = 2 * Math.PI; }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(center, center);
        // Canvas angles increase clockwise, cartesian counter-clockwise
        ctx.arc(center, center, radius, -startAngle, -endAngle, true);
        ctx.closePath();
        ctx.fillStyle = isDark ? 'rgba(10, 132, 255, 0.22)' : 'rgba(0, 122, 255, 0.14)';
        ctx.fill();
        ctx.restore();
    }

    drawSubdivisions(ctx, center, radius, isDark) {
        const specialAngles = [
            { deg: 30, radStr: 'π/6' },
            { deg: 45, radStr: 'π/4' },
            { deg: 60, radStr: 'π/3' },
            { deg: 120, radStr: '2π/3' },
            { deg: 135, radStr: '3π/4' },
            { deg: 150, radStr: '5π/6' },
            { deg: 210, radStr: '7π/6' },
            { deg: 225, radStr: '5π/4' },
            { deg: 240, radStr: '4π/3' },
            { deg: 300, radStr: '5π/3' },
            { deg: 315, radStr: '7π/4' },
            { deg: 330, radStr: '11π/6' }
        ];

        ctx.save();
        for (let item of specialAngles) {
            const deg = item.deg;
            const rad = (deg * Math.PI) / 180.0;
            const is45 = deg % 90 === 45;
            const tickLen = is45 ? 9 : 6;

            const xOuter = center + radius * Math.cos(rad);
            const yOuter = center - radius * Math.sin(rad);

            const xInner = center + (radius - tickLen) * Math.cos(rad);
            const yInner = center - (radius - tickLen) * Math.sin(rad);

            ctx.beginPath();
            ctx.moveTo(xInner, yInner);
            ctx.lineTo(xOuter, yOuter); // Fixed: was addLine
            ctx.strokeStyle = is45
                ? (isDark ? 'rgba(255, 159, 10, 0.8)' : 'rgba(255, 149, 0, 0.75)')
                : (isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.28)');
            ctx.lineWidth = is45 ? 2.0 : 1.4;
            ctx.stroke();

            // Label on outer circumference for larger sizes
            if (this.logicalSize >= 310) {
                const labelDist = radius + 14;
                const lx = center + labelDist * Math.cos(rad);
                const ly = center - labelDist * Math.sin(rad);
                ctx.font = '600 9px ui-monospace, SFMono-Regular, monospace';
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${deg}°`, lx, ly);
            }
        }
        ctx.restore();
    }

    drawAxes(ctx, center, radius, size, isDark) {
        ctx.save();
        const axisColor = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.7)';
        const tickColor = isDark ? '#ffffff' : '#111111';
        const axisLength = radius * 1.26;
        const arrowSize = 8;

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
        ctx.lineTo(center + axisLength - arrowSize, center - arrowSize * 0.45);
        ctx.lineTo(center + axisLength - arrowSize, center + arrowSize * 0.45);
        ctx.closePath();
        ctx.fillStyle = axisColor;
        ctx.fill();

        // Y Axis
        ctx.beginPath();
        ctx.moveTo(center, center + axisLength);
        ctx.lineTo(center, center - axisLength);
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Y Arrow
        ctx.beginPath();
        ctx.moveTo(center, center - axisLength);
        ctx.lineTo(center - arrowSize * 0.45, center - axisLength + arrowSize);
        ctx.lineTo(center + arrowSize * 0.45, center - axisLength + arrowSize);
        ctx.closePath();
        ctx.fillStyle = axisColor;
        ctx.fill();

        // Center origin dot (0, 0)
        ctx.beginPath();
        ctx.arc(center, center, 3, 0, 2 * Math.PI);
        ctx.fillStyle = axisColor;
        ctx.fill();

        // Axes Labels
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = axisColor;
        ctx.textAlign = 'right';
        ctx.fillText('X (cos)', center + axisLength, center + 16);
        ctx.textAlign = 'left';
        ctx.fillText('Y (sin)', center + 8, center - axisLength + 10);

        // Cardinal Ticks [0°/360°, 90°, 180°, 270°]
        const tickLen = 10;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = tickColor;

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

        // Text Labels for Major Angles (90°, 180°, 270°, 360°) as required by prompt
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';

        // 0° / 360°
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('0° / 360°', center + radius + 7, center - 6);
        ctx.font = '600 10px ui-monospace, monospace';
        ctx.fillStyle = isDark ? '#98989d' : '#6e6e73';
        ctx.fillText('(0 / 2π)', center + radius + 7, center + 9);

        // 90°
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('90° (π/2)', center, center - radius - 6);

        // 180°
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('180°', center - radius - 7, center - 6);
        ctx.font = '600 10px ui-monospace, monospace';
        ctx.fillStyle = isDark ? '#98989d' : '#6e6e73';
        ctx.fillText('(π)', center - radius - 7, center + 9);

        // 270°
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('270° (3π/2)', center, center + radius + 6);

        ctx.restore();
    }

    drawRotationArcOrSpiral(ctx, center, radius, totalDegrees, isDark) {
        if (Math.abs(totalDegrees) < 0.2) return;

        ctx.save();
        const isPositive = totalDegrees >= 0;
        const color = isPositive ? '#007aff' : '#ff3b30';
        const arcBaseRadius = radius * 0.44;

        if (Math.abs(totalDegrees) <= 360) {
            ctx.beginPath();
            // Canvas arc is clockwise, positive cartesian is counter-clockwise
            ctx.arc(center, center, arcBaseRadius, 0, -((totalDegrees * Math.PI) / 180.0), isPositive);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            this.drawArcArrow(ctx, center, arcBaseRadius, totalDegrees, isPositive);
        } else {
            // Archimedean spiral for angles up to 5000°
            const totalRad = (Math.abs(totalDegrees) * Math.PI) / 180.0;
            const totalTurns = totalRad / (2 * Math.PI);

            const minR = radius * 0.16;
            const maxR = radius * 0.60;

            const visualTurns = Math.min(totalTurns, 4.5);
            const visualDegrees = visualTurns * 360.0;
            const steps = Math.floor(visualDegrees / 3.0) + 1;

            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const currentDeg = i * 3.0 * (isPositive ? 1.0 : -1.0);
                const t = i / steps;
                const currentR = minR + t * (maxR - minR);
                const currentRad = (currentDeg * Math.PI) / 180.0;

                const x = center + currentR * Math.cos(currentRad);
                const y = center - currentR * Math.sin(currentRad);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.stroke();

            this.drawArcArrow(ctx, center, maxR, totalDegrees, isPositive);

            // Turn Counter Badge
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const revCount = (Math.abs(totalDegrees) / 360.0).toFixed(1);
            const revText = `${isPositive ? '+' : '−'}${revCount} об.`;
            ctx.fillText(revText, center, center + radius * 0.28);
        }
        ctx.restore();
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

    drawProjections(ctx, center, radius, normDeg, isDark) {
        const rad = (normDeg * Math.PI) / 180.0;
        const targetX = center + radius * Math.cos(rad);
        const targetY = center - radius * Math.sin(rad);

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.4;

        // Proj to X (cos)
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX, center);
        ctx.strokeStyle = isDark ? 'rgba(175, 82, 222, 0.75)' : 'rgba(88, 86, 214, 0.7)';
        ctx.stroke();

        // Dot on X axis
        ctx.beginPath();
        ctx.arc(targetX, center, 3, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#bf5af2' : '#5856d6';
        ctx.fill();

        // Proj to Y (sin)
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(center, targetY);
        ctx.strokeStyle = isDark ? 'rgba(48, 209, 88, 0.75)' : 'rgba(52, 199, 89, 0.7)';
        ctx.stroke();

        // Dot on Y axis
        ctx.beginPath();
        ctx.arc(center, targetY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#30d158' : '#34c759';
        ctx.fill();

        ctx.restore();
    }

    drawTerminalRay(ctx, center, radius, normDeg) {
        const rad = (normDeg * Math.PI) / 180.0;
        const targetX = center + radius * Math.cos(rad);
        const targetY = center - radius * Math.sin(rad);

        ctx.save();

        // Terminal Ray
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = '#ff9500';
        ctx.lineWidth = 3.6;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Endpoint Glow
        ctx.beginPath();
        ctx.arc(targetX, targetY, 9, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 149, 0, 0.32)';
        ctx.fill();

        // Solid Endpoint
        ctx.beginPath();
        ctx.arc(targetX, targetY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff9500';
        ctx.fill();

        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircleCanvas;
}

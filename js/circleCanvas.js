/**
 * Clean & Touch-Friendly Canvas for Trigonometric Circle
 * Автор: @slawastr 1-26 design
 */

class CircleCanvas {
    constructor(canvasElement, onAngleChange) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.onAngleChange = onAngleChange;
        this.onAlphaChange = null;
        this.showAlphaReference = true;
        this.isDragging = false;
        this.result = null;
        this.logicalSize = 320;

        this.initEvents();
        this.resize();

        window.addEventListener('resize', () => this.resize());
        if (window.ResizeObserver && this.canvas.parentElement) {
            new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
        }
    }

    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const availableW = rect.width > 0 ? rect.width : (window.innerWidth - 32);

        // Responsive circle sizing: fits container cleanly, max 360px
        let size = Math.floor(Math.min(availableW - 12, 360));
        if (size < 240) size = 240;

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
            const y = -(clientY - rect.top - this.logicalSize / 2); // Invert Y for Cartesian coordinates

            let rad = Math.atan2(y, x);
            if (rad < 0) rad += 2 * Math.PI;
            return (rad * 180.0) / Math.PI;
        };

        const handleStart = (e) => {
            this.isDragging = true;
            const deg = getAngleFromEvent(e);
            if (this.result && this.result.isSeries) {
                let alpha = deg;
                if (alpha > 180) alpha = 360 - alpha;
                if (alpha > 90) alpha = 180 - alpha;
                alpha = Math.max(10, Math.min(80, Math.round(alpha)));
                this.onAlphaChange?.(alpha);
            } else {
                this.onAngleChange?.(deg);
            }
            if (e.cancelable && e.type.startsWith('touch')) {
                e.preventDefault();
            }
        };

        const handleMove = (e) => {
            if (!this.isDragging) return;
            const deg = getAngleFromEvent(e);
            if (this.result && this.result.isSeries) {
                let alpha = deg;
                if (alpha > 180) alpha = 360 - alpha;
                if (alpha > 90) alpha = 180 - alpha;
                alpha = Math.max(10, Math.min(80, Math.round(alpha)));
                this.onAlphaChange?.(alpha);
            } else {
                this.onAngleChange?.(deg);
            }
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
        // Radius tuned to leave 50px margins for labels without clipping
        const radius = size * 0.32;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
            (!document.documentElement.getAttribute('data-theme') &&
             window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

        ctx.clearRect(0, 0, size, size);

        // 1. Shaded Quadrant Highlight (calm soft background)
        if (this.result && this.result.isValid) {
            if (this.result.isSeries && this.result.quadrants) {
                const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
                for (const qStr of this.result.quadrants) {
                    const qNum = romanMap[qStr];
                    if (qNum) {
                        this.drawQuadrantHighlight(ctx, center, radius, qNum, isDark);
                    }
                }
            } else if (this.result.quadrant && !this.result.quadrant.isAxis) {
                this.drawQuadrantHighlight(ctx, center, radius, this.result.quadrant.number, isDark);
            }
        }

        // 2. Unit Circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 3. Roman Quadrant Watermarks (I, II, III, IV)
        this.drawQuadrantWatermarks(ctx, center, radius, isDark);

        // 4. Subdivision Ticks
        this.drawSubdivisions(ctx, center, radius, isDark);

        // 5. Coordinate Axes with Arrows and Labels
        this.drawAxes(ctx, center, radius, size, isDark);

        if (!this.result || !this.result.isValid) return;

        if (this.result.isSeries) {
            this.drawSeriesRays(ctx, center, radius, this.result, isDark);
        } else {
            // 6. Rotation Arc or Archimedean Spiral
            this.drawRotationArcOrSpiral(ctx, center, radius, this.result.degrees, isDark);

            // 7. Projections to Axes (cos, sin)
            this.drawProjections(ctx, center, radius, this.result.normalizedDegrees, isDark);

            // 8. Terminal Ray (Contrasting orange with glowing endpoint)
            this.drawTerminalRay(ctx, center, radius, this.result.normalizedDegrees);
        }
    }

    drawQuadrantWatermarks(ctx, center, radius, isDark) {
        const dist = radius * 0.62;
        ctx.save();
        ctx.font = '700 16px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.11)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('I', center + dist * 0.72, center - dist * 0.72);
        ctx.fillText('II', center - dist * 0.72, center - dist * 0.72);
        ctx.fillText('III', center - dist * 0.72, center + dist * 0.72);
        ctx.fillText('IV', center + dist * 0.72, center + dist * 0.72);
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
        ctx.arc(center, center, radius, -startAngle, -endAngle, true);
        ctx.closePath();
        ctx.fillStyle = isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 113, 227, 0.12)';
        ctx.fill();
        ctx.restore();
    }

    drawSubdivisions(ctx, center, radius, isDark) {
        const specialAngles = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];

        ctx.save();
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
            ctx.lineTo(xOuter, yOuter);
            ctx.strokeStyle = is45
                ? (isDark ? 'rgba(255, 159, 10, 0.75)' : 'rgba(255, 149, 0, 0.7)')
                : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.22)');
            ctx.lineWidth = is45 ? 1.8 : 1.2;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawAxes(ctx, center, radius, size, isDark) {
        ctx.save();
        const axisColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)';
        const tickColor = isDark ? '#ffffff' : '#111111';
        const axisLength = radius * 1.28;
        const arrowSize = 7;

        // X Axis
        ctx.beginPath();
        ctx.moveTo(center - axisLength, center);
        ctx.lineTo(center + axisLength, center);
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1.4;
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
        ctx.stroke();

        // Y Arrow
        ctx.beginPath();
        ctx.moveTo(center, center - axisLength);
        ctx.lineTo(center - arrowSize * 0.45, center - axisLength + arrowSize);
        ctx.lineTo(center + arrowSize * 0.45, center - axisLength + arrowSize);
        ctx.closePath();
        ctx.fill();

        // Origin Center Dot O(0,0)
        ctx.beginPath();
        ctx.arc(center, center, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = axisColor;
        ctx.fill();

        // Clean Axis Labels (x, y) at arrowtips without colliding with angle labels
        ctx.font = 'italic 600 12px "Times New Roman", system-ui, -apple-system, serif';
        ctx.fillStyle = axisColor;
        ctx.textAlign = 'right';
        ctx.fillText('x', center + axisLength - 1, center - 7);
        ctx.textAlign = 'right';
        ctx.fillText('y', center - 7, center - axisLength + 10);

        // Cardinal Ticks [0°/360°, 90°, 180°, 270°]
        const tickLen = 9;
        ctx.lineWidth = 2.2;
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

        // Major Labels with Safe Padding to Avoid Clipping
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#1d1d1f';

        // 0° / 360° (Right)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('0° / 360°', center + radius + 6, center - 6);
        ctx.font = '500 9.5px ui-monospace, monospace';
        ctx.fillStyle = isDark ? '#98989d' : '#86868b';
        ctx.fillText('(0 / 2π)', center + radius + 6, center + 8);

        // 90° (Top)
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#1d1d1f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('90° (π/2)', center, center - radius - 5);

        // 180° (Left)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('180°', center - radius - 6, center - 6);
        ctx.font = '500 9.5px ui-monospace, monospace';
        ctx.fillStyle = isDark ? '#98989d' : '#86868b';
        ctx.fillText('(π)', center - radius - 6, center + 8);

        // 270° (Bottom)
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#1d1d1f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('270° (3π/2)', center, center + radius + 5);

        ctx.restore();
    }

    drawRotationArcOrSpiral(ctx, center, radius, totalDegrees, isDark) {
        if (Math.abs(totalDegrees) < 0.2) return;

        ctx.save();
        const isPositive = totalDegrees >= 0;
        const color = isPositive ? '#0071e3' : '#ff3b30';
        const arcBaseRadius = radius * 0.44;

        if (Math.abs(totalDegrees) <= 360) {
            ctx.beginPath();
            ctx.arc(center, center, arcBaseRadius, 0, -((totalDegrees * Math.PI) / 180.0), isPositive);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.stroke();

            this.drawArcArrow(ctx, center, arcBaseRadius, totalDegrees, isPositive);
        } else {
            // Archimedean spiral for angles up to 5000°
            const totalRad = (Math.abs(totalDegrees) * Math.PI) / 180.0;
            const totalTurns = totalRad / (2 * Math.PI);

            const minR = radius * 0.16;
            const maxR = radius * 0.60;

            const visualTurns = Math.min(totalTurns, 4.2);
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
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            ctx.stroke();

            this.drawArcArrow(ctx, center, maxR, totalDegrees, isPositive);

            // Turn Counter Badge
            ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
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
        const arrowLen = 7.5;
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
        ctx.fillStyle = isPositive ? '#0071e3' : '#ff3b30';
        ctx.fill();
    }

    drawProjections(ctx, center, radius, normDeg, isDark) {
        const rad = (normDeg * Math.PI) / 180.0;
        const targetX = center + radius * Math.cos(rad);
        const targetY = center - radius * Math.sin(rad);

        ctx.save();
        ctx.setLineDash([3.5, 3.5]);
        ctx.lineWidth = 1.3;

        // Proj to X (cos)
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX, center);
        ctx.strokeStyle = isDark ? 'rgba(175, 82, 222, 0.7)' : 'rgba(88, 86, 214, 0.65)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(targetX, center, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#bf5af2' : '#5856d6';
        ctx.fill();

        // Proj to Y (sin)
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(center, targetY);
        ctx.strokeStyle = isDark ? 'rgba(48, 209, 88, 0.7)' : 'rgba(52, 199, 89, 0.65)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, targetY, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = isDark ? '#30d158' : '#34c759';
        ctx.fill();

        ctx.restore();
    }

    drawTerminalRay(ctx, center, radius, normDeg) {
        const rad = (normDeg * Math.PI) / 180.0;
        const targetX = center + radius * Math.cos(rad);
        const targetY = center - radius * Math.sin(rad);

        ctx.save();

        // Contrasting bright orange ray
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = '#ff9500';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glowing outer halo
        ctx.beginPath();
        ctx.arc(targetX, targetY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 149, 0, 0.28)';
        ctx.fill();

        // Solid endpoint
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff9500';
        ctx.fill();

        ctx.restore();
    }

    drawSeriesRays(ctx, center, radius, seriesResult, isDark) {
        if (!seriesResult || !seriesResult.points) return;

        // 1. Reference Angle α (Dashed Ray & Arc in Quadrant I)
        const alphaDeg = seriesResult.alphaDeg || 35;
        const alphaRad = (alphaDeg * Math.PI) / 180.0;

        if (this.showAlphaReference !== false && seriesResult.alphaSign !== 0) {
            ctx.save();
            // Dashed reference ray in Quadrant I
            ctx.beginPath();
            ctx.setLineDash([5, 4]);
            ctx.moveTo(center, center);
            ctx.lineTo(center + radius * Math.cos(alphaRad), center - radius * Math.sin(alphaRad));
            ctx.strokeStyle = isDark ? 'rgba(10, 132, 255, 0.75)' : 'rgba(0, 113, 227, 0.75)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Reference arc for α
            const arcRadius = Math.min(radius * 0.38, 42);
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(center, center, arcRadius, 0, -alphaRad, true);
            ctx.strokeStyle = isDark ? '#2997ff' : '#0071e3';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Label α
            const midAlpha = alphaRad / 2;
            const labelDist = arcRadius + 14;
            ctx.font = 'italic 700 15px "Times New Roman", Georgia, serif';
            ctx.fillStyle = isDark ? '#5ac8fa' : '#0071e3';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('α', center + labelDist * Math.cos(midAlpha), center - labelDist * Math.sin(midAlpha));
            ctx.restore();
        }

        // 2. Draw each point and ray in the series
        const points = seriesResult.points;
        const colors = [
            '#ff9500', // vibrant orange
            '#ff2d55', // pink-red
            '#30d158', // green
            '#af52de', // purple
            '#5856d6', // indigo
            '#00c7be', // teal
            '#ffd60a', // yellow
            '#ff3b30'  // red
        ];

        points.forEach((pt, idx) => {
            const rad = pt.radians;
            const color = colors[idx % colors.length];

            ctx.save();
            // Ray from origin
            ctx.beginPath();
            ctx.moveTo(center, center);
            const ptX = center + radius * Math.cos(rad);
            const ptY = center - radius * Math.sin(rad);
            ctx.lineTo(ptX, ptY);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Outer halo
            ctx.beginPath();
            ctx.arc(ptX, ptY, 7.5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.28;
            ctx.fill();

            // Solid marker
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(ptX, ptY, 4.5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            // White center dot
            ctx.beginPath();
            ctx.arc(ptX, ptY, 1.8, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Label text around circumference
            const labelR = radius + (points.length > 4 ? 14 : 20);
            const lblX = center + labelR * Math.cos(rad);
            const lblY = center - labelR * Math.sin(rad);

            ctx.font = '600 11.5px -apple-system, system-ui, sans-serif';
            ctx.fillStyle = isDark ? '#f5f5f7' : '#1d1d1f';

            if (Math.abs(Math.cos(rad)) < 0.25) {
                ctx.textAlign = 'center';
                ctx.textBaseline = Math.sin(rad) > 0 ? 'bottom' : 'top';
            } else {
                ctx.textAlign = Math.cos(rad) > 0 ? 'left' : 'right';
                ctx.textBaseline = 'middle';
            }

            let displayText = pt.label;
            if (points.length >= 8) {
                displayText = `${seriesResult.paramVar}=${pt.k}`;
            }
            ctx.fillText(displayText, lblX, lblY);
            ctx.restore();
        });

        // 3. For single point series with negative alpha (e.g. -α + 2πn): draw directional rotation arc
        if (points.length === 1 && seriesResult.alphaSign === -1) {
            ctx.save();
            const arcR = Math.min(radius * 0.44, 46);
            ctx.beginPath();
            ctx.arc(center, center, arcR, 0, alphaRad, false);
            ctx.strokeStyle = '#ff9500';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            const arrowX = center + arcR * Math.cos(alphaRad);
            const arrowY = center + arcR * Math.sin(alphaRad);
            ctx.fillStyle = '#ff9500';
            ctx.beginPath();
            ctx.arc(arrowX, arrowY, 3, 0, 2 * Math.PI);
            ctx.fill();

            const midA = alphaRad / 2;
            const lblR = arcR + 13;
            ctx.font = 'italic 700 13px "Times New Roman", serif';
            ctx.fillStyle = '#ff9500';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('-α', center + lblR * Math.cos(midA), center + lblR * Math.sin(midA));
            ctx.restore();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircleCanvas;
}

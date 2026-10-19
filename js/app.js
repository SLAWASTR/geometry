/**
 * Mobile App Controller
 * Автор: @slawastr 1-26 design
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    let inputMode = 'inline'; // 'inline' or 'fraction'
    let rawInputText = '3π/4';
    let fracNumerator = '3π';
    let fracDenominator = '4';
    let fracNegative = false;
    let sliderDegrees = 135.0;

    // DOM Elements
    const modeInlineBtn = document.getElementById('modeInlineBtn');
    const modeFractionBtn = document.getElementById('modeFractionBtn');
    const inlineContainer = document.getElementById('inlineContainer');
    const fractionContainer = document.getElementById('fractionContainer');
    const inlineInput = document.getElementById('inlineInput');
    const clearInputBtn = document.getElementById('clearInputBtn');
    const numInput = document.getElementById('numInput');
    const denInput = document.getElementById('denInput');
    const signToggleBtn = document.getElementById('signToggleBtn');
    const addPiBtn = document.getElementById('addPiBtn');
    const clearFracBtn = document.getElementById('clearFracBtn');
    const errorBanner = document.getElementById('errorBanner');
    const errorText = document.getElementById('errorText');

    const slider = document.getElementById('angleSlider');
    const sliderValueDisplay = document.getElementById('sliderValueDisplay');
    const stepperMinus360 = document.getElementById('stepperMinus360');
    const stepperMinus90 = document.getElementById('stepperMinus90');
    const stepperZero = document.getElementById('stepperZero');
    const stepperPlus90 = document.getElementById('stepperPlus90');
    const stepperPlus360 = document.getElementById('stepperPlus360');

    // Metrics elements
    const metricOriginalDeg = document.getElementById('metricOriginalDeg');
    const metricOriginalRad = document.getElementById('metricOriginalRad');
    const metricNormDeg = document.getElementById('metricNormDeg');
    const metricTurns = document.getElementById('metricTurns');
    const metricQuadrant = document.getElementById('metricQuadrant');
    const metricQuadrantBounds = document.getElementById('metricQuadrantBounds');
    const metricNearest = document.getElementById('metricNearest');
    const metricNearestDist = document.getElementById('metricNearestDist');

    // Steps container & Copy button
    const stepsContainer = document.getElementById('stepsContainer');
    const copySolutionBtn = document.getElementById('copySolutionBtn');

    // Canvas init
    const canvasEl = document.getElementById('trigCanvas');
    const circleCanvas = new CircleCanvas(canvasEl, (selectedDegree) => {
        // Snap to nearest 15° if within 3°
        const snapCandidate = Math.round(selectedDegree / 15.0) * 15.0;
        const deg = Math.abs(selectedDegree - snapCandidate) < 3.0 ? snapCandidate : Math.round(selectedDegree);
        updateFromDegrees(deg);
    });

    // Update entire app from string expression
    function updateFromExpression(expr) {
        rawInputText = expr;
        inlineInput.value = expr;
        syncFractionFromExpr(expr);

        const result = TrigEngine.calculate(expr);
        circleCanvas.setResult(result);
        renderMetrics(result);
        renderSteps(result);

        if (result.isValid) {
            sliderDegrees = result.degrees;
            slider.value = Math.max(-5000, Math.min(5000, Math.round(result.degrees)));
            sliderValueDisplay.textContent = `${Math.round(result.degrees)}°`;
            errorBanner.classList.add('hidden');
        } else {
            if (expr.trim()) {
                errorText.textContent = result.errorMessage || 'Ошибка ввода';
                errorBanner.classList.remove('hidden');
            } else {
                errorBanner.classList.add('hidden');
            }
        }
    }

    // Update from degrees (e.g. from slider or canvas touch)
    function updateFromDegrees(deg) {
        deg = Math.max(-5000, Math.min(5000, deg));
        sliderDegrees = deg;
        slider.value = deg;
        sliderValueDisplay.textContent = `${Math.round(deg)}°`;

        const degInt = Math.round(deg);
        const sign = degInt < 0 ? '-' : '';
        const absDeg = Math.abs(degInt);

        const g = TrigEngine.gcd(absDeg, 180);
        const k = absDeg / g;
        const m = 180 / g;

        let expr = '';
        if (m === 1) {
            if (k === 0) expr = '0';
            else if (k === 1) expr = `${sign}π`;
            else expr = `${sign}${k}π`;
        } else {
            const numStr = k === 1 ? 'π' : `${k}π`;
            expr = `${sign}${numStr}/${m}`;
        }

        updateFromExpression(expr);
    }

    function syncFractionFromExpr(expr) {
        let s = (expr || '').trim();
        if (s.startsWith('-') || s.startsWith('−')) {
            fracNegative = true;
            s = s.substring(1);
        } else {
            fracNegative = false;
        }

        signToggleBtn.textContent = fracNegative ? '−' : '+';
        signToggleBtn.classList.toggle('negative', fracNegative);

        if (s.includes('/')) {
            const parts = s.split('/');
            fracNumerator = parts[0] || '';
            fracDenominator = parts[1] || '1';
        } else {
            fracNumerator = s;
            fracDenominator = '1';
        }

        numInput.value = fracNumerator;
        denInput.value = fracDenominator;
    }

    function renderMetrics(res) {
        if (!res.isValid) {
            metricOriginalDeg.textContent = '—';
            metricOriginalRad.textContent = 'нет данных';
            metricNormDeg.textContent = '—';
            metricTurns.textContent = 'нет данных';
            metricQuadrant.textContent = '—';
            metricQuadrantBounds.textContent = 'нет данных';
            metricNearest.textContent = '—';
            metricNearestDist.textContent = 'нет данных';
            return;
        }

        metricOriginalDeg.textContent = TrigEngine.formatDegree(res.degrees);
        metricOriginalRad.textContent = res.isFraction && res.denominator === 1
            ? `${res.numerator}π рад`
            : (res.isFraction ? `${res.numerator}π/${res.denominator} рад` : `${res.radians.toFixed(3)} рад`);

        metricNormDeg.textContent = TrigEngine.formatDegree(res.normalizedDegrees);

        if (res.degrees >= 0 && res.degrees < 360) {
            metricTurns.textContent = 'В пределах 1-го оборота';
        } else if (res.degrees >= 360) {
            metricTurns.textContent = `Отброшено ${res.turns} об. (против час.)`;
        } else {
            metricTurns.textContent = `Прибавлено ${Math.abs(res.turns)} об. (по час.)`;
        }

        metricQuadrant.textContent = res.quadrant.title;
        metricQuadrantBounds.textContent = res.quadrant.desc || '—';

        if (res.distanceToNearestTick < 1e-4) {
            metricNearest.textContent = `${res.nearestTicks[0] || 360}° (на оси)`;
        } else if (res.nearestTicks.length === 2) {
            metricNearest.textContent = `${res.nearestTicks[0]}° и ${res.nearestTicks[1]}°`;
        } else {
            metricNearest.textContent = `${res.nearestTicks[0]}°`;
        }
        metricNearestDist.textContent = `Расстояние: ${TrigEngine.formatDegree(res.distanceToNearestTick)}`;
    }

    function renderSteps(res) {
        stepsContainer.innerHTML = '';
        if (!res.isValid || !res.steps || res.steps.length === 0) {
            stepsContainer.innerHTML = `
                <div class="empty-steps">
                    <p>Введите угол или выберите готовый пример выше, чтобы увидеть пошаговое решение.</p>
                </div>
            `;
            return;
        }

        res.steps.forEach(step => {
            const card = document.createElement('div');
            card.className = 'step-card';
            card.innerHTML = `
                <div class="step-card-header">
                    <div class="step-badge">${step.stepNumber}</div>
                    <div class="step-title">${step.title}</div>
                    <div class="step-summary">${step.summary}</div>
                </div>
                ${step.formula ? `<div class="step-formula">${step.formula}</div>` : ''}
                <div class="step-explanation">${step.explanation.replace(/\n/g, '<br>')}</div>
            `;
            stepsContainer.appendChild(card);
        });
    }

    // Event Listeners for Segmented Picker
    modeInlineBtn.addEventListener('click', () => {
        inputMode = 'inline';
        modeInlineBtn.classList.add('active');
        modeFractionBtn.classList.remove('active');
        inlineContainer.classList.remove('hidden');
        fractionContainer.classList.add('hidden');
    });

    modeFractionBtn.addEventListener('click', () => {
        inputMode = 'fraction';
        modeFractionBtn.classList.add('active');
        modeInlineBtn.classList.remove('active');
        fractionContainer.classList.remove('hidden');
        inlineContainer.classList.add('hidden');
    });

    // Inline input events
    inlineInput.addEventListener('input', (e) => {
        updateFromExpression(e.target.value);
    });

    clearInputBtn.addEventListener('click', () => {
        updateFromExpression('');
    });

    // Quick symbol buttons
    document.querySelectorAll('.quick-sym-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sym = btn.getAttribute('data-sym');
            if (sym === '−') {
                if (inlineInput.value.startsWith('-')) {
                    inlineInput.value = inlineInput.value.substring(1);
                } else {
                    inlineInput.value = '-' + inlineInput.value;
                }
            } else {
                inlineInput.value += sym;
            }
            updateFromExpression(inlineInput.value);
        });
    });

    // Textbook fraction inputs
    signToggleBtn.addEventListener('click', () => {
        fracNegative = !fracNegative;
        signToggleBtn.textContent = fracNegative ? '−' : '+';
        signToggleBtn.classList.toggle('negative', fracNegative);
        commitFraction();
    });

    numInput.addEventListener('input', () => commitFraction());
    denInput.addEventListener('input', () => commitFraction());

    addPiBtn.addEventListener('click', () => {
        if (!numInput.value.includes('π') && !numInput.value.includes('п')) {
            numInput.value += 'π';
        }
        commitFraction();
    });

    clearFracBtn.addEventListener('click', () => {
        numInput.value = '';
        denInput.value = '1';
        fracNegative = false;
        signToggleBtn.textContent = '+';
        signToggleBtn.classList.remove('negative');
        updateFromExpression('');
    });

    document.querySelectorAll('.den-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            denInput.value = btn.getAttribute('data-den');
            commitFraction();
        });
    });

    function commitFraction() {
        const sign = fracNegative ? '-' : '';
        const num = (numInput.value || '').trim();
        const den = (denInput.value || '').trim();
        const expr = `${sign}${num}/${den}`;
        updateFromExpression(expr);
    }

    // Slider events
    slider.addEventListener('input', (e) => {
        updateFromDegrees(parseFloat(e.target.value));
    });

    // Steppers events
    stepperMinus360.addEventListener('click', () => updateFromDegrees(sliderDegrees - 360));
    stepperMinus90.addEventListener('click', () => updateFromDegrees(sliderDegrees - 90));
    stepperZero.addEventListener('click', () => updateFromDegrees(0));
    stepperPlus90.addEventListener('click', () => updateFromDegrees(sliderDegrees + 90));
    stepperPlus360.addEventListener('click', () => updateFromDegrees(sliderDegrees + 360));

    // Examples pills
    document.querySelectorAll('.example-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            updateFromExpression(val);
        });
    });

    // Copy Solution
    copySolutionBtn.addEventListener('click', () => {
        const res = TrigEngine.calculate(inlineInput.value);
        if (!res.isValid) return;

        let text = `Решение задачи по тригонометрии:\n`;
        text += `Автор: @slawastr 1-26 design\n`;
        text += `Исходный угол: ${res.rawInput}\n`;
        text += `В градусах: ${TrigEngine.formatDegree(res.degrees)}\n`;
        text += `Угол на круге [0°, 360°): ${TrigEngine.formatDegree(res.normalizedDegrees)}\n`;
        text += `Положение: ${res.quadrant.title}\n`;
        text += `Ближайшая засечка: ${res.nearestTickSummary}\n\n`;
        text += `Шаги решения:\n`;
        res.steps.forEach(s => {
            text += `\nШаг ${s.stepNumber}. ${s.title}\n`;
            if (s.formula) text += `Формула: ${s.formula}\n`;
            text += `${s.explanation}\n`;
        });
        text += `\nРазработано: @slawastr 1-26 design`;

        navigator.clipboard.writeText(text).then(() => {
            copySolutionBtn.textContent = 'Скопировано!';
            copySolutionBtn.classList.add('copied');
            setTimeout(() => {
                copySolutionBtn.textContent = 'Скопировать';
                copySolutionBtn.classList.remove('copied');
            }, 2000);
        });
    });

    // Initial calculation
    updateFromExpression('3π/4');
});

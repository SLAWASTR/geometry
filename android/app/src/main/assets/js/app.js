/**
 * Application Controller for Trigonometric Circle
 * Автор: @slawastr 1-26 design
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let inputMode = 'inline'; // 'inline' | 'fraction'
    let rawInputText = '3π/4';
    let fracNumerator = '3π';
    let fracDenominator = '4';
    let fracNegative = false;
    let sliderDegrees = 135.0;

    // DOM Elements - Window Titlebar
    const btnTrafficClose = document.getElementById('btnTrafficClose');
    const btnTrafficMinimize = document.getElementById('btnTrafficMinimize');
    const btnTrafficMaximize = document.getElementById('btnTrafficMaximize');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    // DOM Elements - Mode Switcher & Inputs
    const modeInlineBtn = document.getElementById('modeInlineBtn');
    const modeFractionBtn = document.getElementById('modeFractionBtn');
    const inlineContainer = document.getElementById('inlineContainer');
    const fractionContainer = document.getElementById('fractionContainer');
    const inlineInput = document.getElementById('inlineInput');
    const clearInputBtn = document.getElementById('clearInputBtn');

    // DOM Elements - Textbook Fraction
    const signToggleBtn = document.getElementById('signToggleBtn');
    const numInput = document.getElementById('numInput');
    const denInput = document.getElementById('denInput');
    const addPiBtn = document.getElementById('addPiBtn');
    const clearFracBtn = document.getElementById('clearFracBtn');
    const errorBanner = document.getElementById('errorBanner');
    const errorText = document.getElementById('errorText');

    // DOM Elements - Slider & Steppers
    const slider = document.getElementById('angleSlider');
    const sliderValueDisplay = document.getElementById('sliderValueDisplay');
    const stepperMinus360 = document.getElementById('stepperMinus360');
    const stepperMinus90 = document.getElementById('stepperMinus90');
    const stepperZero = document.getElementById('stepperZero');
    const stepperPlus90 = document.getElementById('stepperPlus90');
    const stepperPlus360 = document.getElementById('stepperPlus360');

    // DOM Elements - Key Metrics
    const metricOriginalDeg = document.getElementById('metricOriginalDeg');
    const metricOriginalRad = document.getElementById('metricOriginalRad');
    const metricNormDeg = document.getElementById('metricNormDeg');
    const metricTurns = document.getElementById('metricTurns');
    const metricQuadrant = document.getElementById('metricQuadrant');
    const metricQuadrantBounds = document.getElementById('metricQuadrantBounds');
    const metricNearest = document.getElementById('metricNearest');
    const metricNearestDist = document.getElementById('metricNearestDist');

    // DOM Elements - Exact Trig Strip
    const valSin = document.getElementById('valSin');
    const valCos = document.getElementById('valCos');
    const valTan = document.getElementById('valTan');
    const valCot = document.getElementById('valCot');

    // DOM Elements - Steps & Copy
    const stepsContainer = document.getElementById('stepsContainer');
    const copySolutionBtn = document.getElementById('copySolutionBtn');
    const copyBtnText = document.getElementById('copyBtnText');

    // Initialize Canvas
    const canvasEl = document.getElementById('trigCanvas');
    let circleCanvas = null;
    try {
        circleCanvas = new CircleCanvas(canvasEl, (selectedDegree) => {
            // Magnetic snap to nearest 15° if within 3°
            const snapCandidate = Math.round(selectedDegree / 15.0) * 15.0;
            const deg = Math.abs(selectedDegree - snapCandidate) <= 3.5 ? snapCandidate : Math.round(selectedDegree);
            updateFromDegrees(deg);
        });
    } catch (err) {
        console.error('Canvas initialization error:', err);
    }

    // Update entire application from text expression
    function updateFromExpression(expr) {
        rawInputText = expr;
        if (inlineInput && document.activeElement !== inlineInput) {
            inlineInput.value = expr;
        }
        syncFractionFromExpr(expr);

        const result = TrigEngine.calculate(expr);
        if (circleCanvas) {
            circleCanvas.setResult(result);
        }
        renderMetrics(result);
        renderTrigStrip(result);
        renderSteps(result);

        if (result.isValid) {
            sliderDegrees = result.degrees;
            if (slider && document.activeElement !== slider) {
                slider.value = Math.max(-5000, Math.min(5000, Math.round(result.degrees)));
            }
            if (sliderValueDisplay) {
                sliderValueDisplay.textContent = `${Math.round(result.degrees)}°`;
            }
            if (errorBanner) {
                errorBanner.classList.add('hidden');
            }
        } else {
            if (expr.trim()) {
                if (errorText) errorText.textContent = result.errorMessage || 'Ошибка формата угла';
                if (errorBanner) errorBanner.classList.remove('hidden');
            } else {
                if (errorBanner) errorBanner.classList.add('hidden');
            }
        }
    }

    // Update application from degree number (e.g. slider, steppers, canvas touch)
    function updateFromDegrees(deg) {
        deg = Math.max(-5000, Math.min(5000, deg));
        sliderDegrees = deg;
        if (slider) slider.value = deg;
        if (sliderValueDisplay) sliderValueDisplay.textContent = `${Math.round(deg)}°`;

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

    // Sync fraction fields when expression changes
    function syncFractionFromExpr(expr) {
        let s = (expr || '').trim();
        if (s.startsWith('-') || s.startsWith('−')) {
            fracNegative = true;
            s = s.substring(1);
        } else {
            fracNegative = false;
        }

        if (signToggleBtn) {
            signToggleBtn.textContent = fracNegative ? '−' : '+';
            signToggleBtn.classList.toggle('negative', fracNegative);
        }

        if (s.includes('/')) {
            const parts = s.split('/');
            fracNumerator = parts[0] || '';
            fracDenominator = parts[1] || '1';
        } else {
            fracNumerator = s;
            fracDenominator = '1';
        }

        if (numInput && document.activeElement !== numInput) {
            numInput.value = fracNumerator;
        }
        if (denInput && document.activeElement !== denInput) {
            denInput.value = fracDenominator;
        }
    }

    // Render Metrics Cards
    function renderMetrics(res) {
        if (!res.isValid) {
            if (metricOriginalDeg) metricOriginalDeg.textContent = '—';
            if (metricOriginalRad) metricOriginalRad.textContent = 'нет данных';
            if (metricNormDeg) metricNormDeg.textContent = '—';
            if (metricTurns) metricTurns.textContent = 'нет данных';
            if (metricQuadrant) metricQuadrant.textContent = '—';
            if (metricQuadrantBounds) metricQuadrantBounds.textContent = 'нет данных';
            if (metricNearest) metricNearest.textContent = '—';
            if (metricNearestDist) metricNearestDist.textContent = 'нет данных';
            return;
        }

        if (metricOriginalDeg) metricOriginalDeg.textContent = TrigEngine.formatDegree(res.degrees);
        if (metricOriginalRad) {
            metricOriginalRad.textContent = res.isFraction && res.denominator === 1
                ? `${res.numerator}π рад`
                : (res.isFraction ? `${res.numerator}π/${res.denominator} рад` : `${res.radians.toFixed(3)} рад`);
        }

        if (metricNormDeg) metricNormDeg.textContent = TrigEngine.formatDegree(res.normalizedDegrees);

        if (metricTurns) {
            if (res.degrees >= 0 && res.degrees < 360) {
                metricTurns.textContent = 'В пределах 1-го оборота';
            } else if (res.degrees >= 360) {
                const turns = Math.floor(res.degrees / 360);
                metricTurns.textContent = `Отброшено ${turns} полных об.`;
            } else {
                const turns = Math.ceil(Math.abs(res.degrees) / 360);
                metricTurns.textContent = `Прибавлено ${turns} полных об.`;
            }
        }

        if (metricQuadrant) metricQuadrant.textContent = res.quadrant.title;
        if (metricQuadrantBounds) metricQuadrantBounds.textContent = res.quadrant.desc || '—';

        if (metricNearest) {
            if (res.distanceToNearestTick < 1e-4) {
                metricNearest.textContent = `${res.nearestTicks[0] || 360}° (на оси)`;
            } else if (res.nearestTicks.length === 2) {
                metricNearest.textContent = `${res.nearestTicks[0]}° и ${res.nearestTicks[1]}°`;
            } else {
                metricNearest.textContent = `${res.nearestTicks[0]}°`;
            }
        }

        if (metricNearestDist) {
            metricNearestDist.textContent = `Расстояние: ${TrigEngine.formatDegree(res.distanceToNearestTick)}`;
        }
    }

    // Render Exact Trig Strip
    function renderTrigStrip(res) {
        if (!res.isValid || !res.trigValues) {
            if (valSin) valSin.textContent = '—';
            if (valCos) valCos.textContent = '—';
            if (valTan) valTan.textContent = '—';
            if (valCot) valCot.textContent = '—';
            return;
        }
        if (valSin) valSin.textContent = res.trigValues.sinExact;
        if (valCos) valCos.textContent = res.trigValues.cosExact;
        if (valTan) valTan.textContent = res.trigValues.tanExact;
        if (valCot) valCot.textContent = res.trigValues.cotExact;
    }

    // Render Step by Step School Explanation
    function renderSteps(res) {
        if (!stepsContainer) return;
        stepsContainer.innerHTML = '';

        if (!res.isValid || !res.steps || res.steps.length === 0) {
            stepsContainer.innerHTML = `
                <div class="empty-steps">
                    <p>Введите выражение угла с π или выберите готовый пример выше, чтобы увидеть подробный школьный разбор решения.</p>
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

    // Commit fraction inputs into expression
    function commitFraction() {
        const sign = fracNegative ? '-' : '';
        const num = (numInput ? numInput.value : '').trim();
        const den = (denInput ? denInput.value : '').trim() || '1';
        const expr = `${sign}${num}/${den}`;
        updateFromExpression(expr);
    }

    // Segmented Mode Switching
    if (modeInlineBtn && modeFractionBtn) {
        modeInlineBtn.addEventListener('click', () => {
            inputMode = 'inline';
            modeInlineBtn.classList.add('active');
            modeInlineBtn.setAttribute('aria-selected', 'true');
            modeFractionBtn.classList.remove('active');
            modeFractionBtn.setAttribute('aria-selected', 'false');
            if (inlineContainer) inlineContainer.classList.remove('hidden');
            if (fractionContainer) fractionContainer.classList.add('hidden');
        });

        modeFractionBtn.addEventListener('click', () => {
            inputMode = 'fraction';
            modeFractionBtn.classList.add('active');
            modeFractionBtn.setAttribute('aria-selected', 'true');
            modeInlineBtn.classList.remove('active');
            modeInlineBtn.setAttribute('aria-selected', 'false');
            if (fractionContainer) fractionContainer.classList.remove('hidden');
            if (inlineContainer) inlineContainer.classList.add('hidden');
        });
    }

    // Inline input events
    if (inlineInput) {
        inlineInput.addEventListener('input', (e) => {
            updateFromExpression(e.target.value);
        });
    }

    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', () => {
            if (inlineInput) inlineInput.value = '';
            updateFromExpression('');
            if (inlineInput) inlineInput.focus();
        });
    }

    // Quick symbol toolbar buttons
    document.querySelectorAll('.quick-sym-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sym = btn.getAttribute('data-sym');
            if (!inlineInput) return;

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
            inlineInput.focus();
        });
    });

    // Fraction controls
    if (signToggleBtn) {
        signToggleBtn.addEventListener('click', () => {
            fracNegative = !fracNegative;
            signToggleBtn.textContent = fracNegative ? '−' : '+';
            signToggleBtn.classList.toggle('negative', fracNegative);
            commitFraction();
        });
    }

    if (numInput) {
        numInput.addEventListener('input', commitFraction);
    }
    if (denInput) {
        denInput.addEventListener('input', commitFraction);
    }

    if (addPiBtn) {
        addPiBtn.addEventListener('click', () => {
            if (numInput) {
                if (!numInput.value.includes('π') && !numInput.value.includes('п')) {
                    numInput.value += 'π';
                }
                commitFraction();
                numInput.focus();
            }
        });
    }

    if (clearFracBtn) {
        clearFracBtn.addEventListener('click', () => {
            if (numInput) numInput.value = '';
            if (denInput) denInput.value = '1';
            fracNegative = false;
            if (signToggleBtn) {
                signToggleBtn.textContent = '+';
                signToggleBtn.classList.remove('negative');
            }
            updateFromExpression('');
        });
    }

    document.querySelectorAll('.den-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            if (denInput) {
                denInput.value = btn.getAttribute('data-den');
                commitFraction();
            }
        });
    });

    // Example Pills
    document.querySelectorAll('.example-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            updateFromExpression(val);
        });
    });

    // Angle Slider
    if (slider) {
        slider.addEventListener('input', (e) => {
            updateFromDegrees(parseFloat(e.target.value));
        });
    }

    // Quick Steppers
    if (stepperMinus360) stepperMinus360.addEventListener('click', () => updateFromDegrees(sliderDegrees - 360));
    if (stepperMinus90) stepperMinus90.addEventListener('click', () => updateFromDegrees(sliderDegrees - 90));
    if (stepperZero) stepperZero.addEventListener('click', () => updateFromDegrees(0));
    if (stepperPlus90) stepperPlus90.addEventListener('click', () => updateFromDegrees(sliderDegrees + 90));
    if (stepperPlus360) stepperPlus360.addEventListener('click', () => updateFromDegrees(sliderDegrees + 360));

    // Traffic Light Buttons
    if (btnTrafficClose) {
        btnTrafficClose.addEventListener('click', () => {
            updateFromDegrees(0);
        });
    }
    if (btnTrafficMinimize) {
        btnTrafficMinimize.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    if (btnTrafficMaximize) {
        btnTrafficMaximize.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
                document.exitFullscreen?.().catch(() => {});
            }
        });
    }

    // Theme Switcher
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let nextTheme = 'dark';
            if (currentTheme === 'dark') {
                nextTheme = 'light';
            } else if (currentTheme === 'light') {
                nextTheme = 'dark';
            } else {
                // system default
                const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                nextTheme = isSystemDark ? 'light' : 'dark';
            }

            document.documentElement.setAttribute('data-theme', nextTheme);
            if (themeIcon) {
                themeIcon.textContent = nextTheme === 'dark' ? '🌙' : '☀️';
            }
            if (circleCanvas) {
                circleCanvas.render();
            }
        });
    }

    // Copy Solution to Clipboard
    if (copySolutionBtn) {
        copySolutionBtn.addEventListener('click', () => {
            const expr = (inlineInput ? inlineInput.value : rawInputText) || '3π/4';
            const res = TrigEngine.calculate(expr);
            if (!res.isValid) return;

            let text = `📐 Решение задания с тригонометрическим кругом:\n`;
            text += `Автор: @slawastr 1-26 design\n`;
            text += `----------------------------------------\n`;
            text += `Исходный угол: ${res.rawInput}\n`;
            text += `В градусах: ${TrigEngine.formatDegree(res.degrees)}\n`;
            text += `Угол на круге [0°, 360°): ${TrigEngine.formatDegree(res.normalizedDegrees)}\n`;
            text += `Положение: ${res.quadrant.title} (${res.quadrant.desc || ''})\n`;
            text += `Ближайшая засечка: ${res.nearestTickSummary}\n`;
            text += `Значения: sin = ${res.trigValues.sinExact}, cos = ${res.trigValues.cosExact}, tg = ${res.trigValues.tanExact}, ctg = ${res.trigValues.cotExact}\n\n`;
            text += `Пошаговый школьный разбор:\n`;

            res.steps.forEach(s => {
                text += `\nШаг ${s.stepNumber}. ${s.title}\n`;
                if (s.formula) text += `Формула: ${s.formula}\n`;
                text += `${s.explanation}\n`;
            });
            text += `\n----------------------------------------\n`;
            text += `Разработано: @slawastr 1-26 design`;

            navigator.clipboard.writeText(text).then(() => {
                if (copyBtnText) copyBtnText.textContent = 'Скопировано!';
                copySolutionBtn.classList.add('copied');
                setTimeout(() => {
                    if (copyBtnText) copyBtnText.textContent = 'Скопировать';
                    copySolutionBtn.classList.remove('copied');
                }, 2200);
            }).catch(() => {
                alert('Решение:\n\n' + text);
            });
        });
    }

    // Initial trigger
    updateFromExpression('3π/4');
});

/**
 * Application Controller for Trigonometric Circle
 * Автор: @slawastr 1-26 design
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let inputMode = 'inline'; // 'inline' | 'fraction' | 'series'
    let rawInputText = '3π/4';
    let fracNumerator = '3π';
    let fracDenominator = '4';
    let fracNegative = false;
    let sliderDegrees = 135.0;

    let seriesExpr = '-α + 2πn, n ∈ Z';
    let seriesAlpha = 35;
    let seriesShowAlphaRef = true;
    let currentSeriesResult = null;

    // DOM Elements - Navigation Bar
    const btnReset = document.getElementById('btnReset');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    // DOM Elements - Mode Switcher & Inputs
    const modeInlineBtn = document.getElementById('modeInlineBtn');
    const modeFractionBtn = document.getElementById('modeFractionBtn');
    const modeSeriesBtn = document.getElementById('modeSeriesBtn');
    const inlineContainer = document.getElementById('inlineContainer');
    const fractionContainer = document.getElementById('fractionContainer');
    const seriesContainer = document.getElementById('seriesContainer');
    const inlineInput = document.getElementById('inlineInput');
    const clearInputBtn = document.getElementById('clearInputBtn');

    // DOM Elements - Series with Alpha
    const seriesInput = document.getElementById('seriesInput');
    const clearSeriesBtn = document.getElementById('clearSeriesBtn');
    const alphaSlider = document.getElementById('alphaSlider');
    const alphaValueDisplay = document.getElementById('alphaValueDisplay');
    const alphaInputField = document.getElementById('alphaInputField');
    const toggleAlphaRefBtn = document.getElementById('toggleAlphaRefBtn');

    // DOM Elements - Secondary Column Sections
    const standardMetricsSection = document.getElementById('standardMetricsSection');
    const seriesMetricsSection = document.getElementById('seriesMetricsSection');
    const seriesQuadTitle = document.getElementById('seriesQuadTitle');
    const seriesQuadSub = document.getElementById('seriesQuadSub');
    const seriesBaseAngle = document.getElementById('seriesBaseAngle');
    const seriesBaseAngleDesc = document.getElementById('seriesBaseAngleDesc');
    const seriesPeriod = document.getElementById('seriesPeriod');
    const seriesPeriodDesc = document.getElementById('seriesPeriodDesc');
    const seriesParam = document.getElementById('seriesParam');
    const seriesNumPoints = document.getElementById('seriesNumPoints');
    const seriesPointsCountBadge = document.getElementById('seriesPointsCountBadge');
    const seriesPointsList = document.getElementById('seriesPointsList');

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
    const degreeInputField = document.getElementById('degreeInputField');
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
            if (inputMode === 'series') return;
            // Magnetic snap to nearest 15° if within 3°
            const snapCandidate = Math.round(selectedDegree / 15.0) * 15.0;
            const deg = Math.abs(selectedDegree - snapCandidate) <= 3.5 ? snapCandidate : Math.round(selectedDegree);
            updateFromDegrees(deg);
        });

        circleCanvas.onAlphaChange = (newAlpha) => {
            seriesAlpha = newAlpha;
            if (alphaSlider) alphaSlider.value = newAlpha;
            if (alphaInputField && document.activeElement !== alphaInputField) alphaInputField.value = newAlpha;
            if (alphaValueDisplay) alphaValueDisplay.textContent = `${newAlpha}°`;
            document.querySelectorAll('.alpha-chip').forEach(c => {
                c.classList.toggle('active', parseInt(c.getAttribute('data-deg')) === newAlpha);
            });
            updateSeries(seriesExpr, seriesAlpha);
        };
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
            if (degreeInputField && document.activeElement !== degreeInputField) {
                degreeInputField.value = Math.round(result.degrees);
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

    // Update application from degree number (e.g. slider, steppers, canvas touch, manual input)
    function updateFromDegrees(deg) {
        deg = Math.max(-5000, Math.min(5000, deg));
        sliderDegrees = deg;
        if (slider && document.activeElement !== slider) slider.value = deg;
        if (sliderValueDisplay) sliderValueDisplay.textContent = `${Math.round(deg)}°`;
        if (degreeInputField && document.activeElement !== degreeInputField) degreeInputField.value = Math.round(deg);

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

    // Unified Mode Switching (Inline | Fraction | Series)
    function switchMode(newMode) {
        inputMode = newMode;

        if (modeInlineBtn) {
            modeInlineBtn.classList.toggle('active', newMode === 'inline');
            modeInlineBtn.setAttribute('aria-selected', newMode === 'inline');
        }
        if (modeFractionBtn) {
            modeFractionBtn.classList.toggle('active', newMode === 'fraction');
            modeFractionBtn.setAttribute('aria-selected', newMode === 'fraction');
        }
        if (modeSeriesBtn) {
            modeSeriesBtn.classList.toggle('active', newMode === 'series');
            modeSeriesBtn.setAttribute('aria-selected', newMode === 'series');
        }

        if (inlineContainer) inlineContainer.classList.toggle('hidden', newMode !== 'inline');
        if (fractionContainer) fractionContainer.classList.toggle('hidden', newMode !== 'fraction');
        if (seriesContainer) seriesContainer.classList.toggle('hidden', newMode !== 'series');

        if (standardMetricsSection) standardMetricsSection.classList.toggle('hidden', newMode === 'series');
        if (seriesMetricsSection) seriesMetricsSection.classList.toggle('hidden', newMode !== 'series');

        if (errorBanner) errorBanner.classList.add('hidden');

        if (newMode === 'series') {
            updateSeries(seriesExpr, seriesAlpha);
        } else {
            updateFromExpression(rawInputText);
        }
    }

    // Update Series with Alpha Mode
    function updateSeries(expr, alpha) {
        seriesExpr = (expr !== undefined && expr !== null) ? expr : seriesExpr;
        if (typeof alpha === 'number') {
            seriesAlpha = alpha;
        }

        if (seriesInput && document.activeElement !== seriesInput) {
            seriesInput.value = seriesExpr;
        }
        if (alphaSlider && document.activeElement !== alphaSlider) {
            alphaSlider.value = seriesAlpha;
        }
        if (alphaInputField && document.activeElement !== alphaInputField) {
            alphaInputField.value = seriesAlpha;
        }
        if (alphaValueDisplay) {
            alphaValueDisplay.textContent = `${seriesAlpha}°`;
        }

        const res = TrigEngine.calculateSeries(seriesExpr, seriesAlpha);
        currentSeriesResult = res;

        if (circleCanvas) {
            circleCanvas.showAlphaReference = seriesShowAlphaRef;
            circleCanvas.setResult(res);
        }

        renderSeriesMetrics(res);
        renderSteps(res);
    }

    // Render Series Metrics in Secondary Column
    function renderSeriesMetrics(res) {
        if (!res) return;

        if (seriesQuadTitle) seriesQuadTitle.textContent = res.quadTitle;
        if (seriesQuadSub) {
            seriesQuadSub.textContent = `${res.numPoints} ${res.numPoints === 1 ? 'точка' : (res.numPoints < 5 ? 'точки' : 'точек')} на круге • период ${res.periodExpr} (${res.periodDeg}°)`;
        }

        const fullBaseExpr = res.offsetExpr
            ? (res.alphaSign === -1 ? `${res.offsetExpr} - α` : `${res.offsetExpr} + α`)
            : (res.alphaSign === -1 ? '-α' : (res.alphaSign === 1 ? 'α' : '0'));

        if (seriesBaseAngle) seriesBaseAngle.textContent = fullBaseExpr;
        if (seriesBaseAngleDesc) {
            seriesBaseAngleDesc.textContent = res.alphaSign === -1 ? 'По часовой стрелке' : (res.alphaSign === 1 ? 'Против часовой' : 'На оси');
        }

        if (seriesPeriod) seriesPeriod.textContent = `${res.periodExpr} (${res.periodDeg}°)`;
        if (seriesPeriodDesc) {
            seriesPeriodDesc.textContent = res.periodDeg === 360 ? 'Полный оборот' : 'Шаг между точками';
        }

        if (seriesParam) seriesParam.textContent = `${res.paramVar} ∈ ℤ`;
        if (seriesNumPoints) seriesNumPoints.textContent = `${res.numPoints} ${res.numPoints === 1 ? 'точка' : (res.numPoints < 5 ? 'точки' : 'точек')}`;
        if (seriesPointsCountBadge) seriesPointsCountBadge.textContent = `${res.numPoints} ${res.numPoints === 1 ? 'точка' : (res.numPoints < 5 ? 'точки' : 'точек')}`;

        if (seriesPointsList) {
            const colors = ['#ff9500', '#ff2d55', '#30d158', '#af52de', '#5856d6', '#00c7be', '#ffd60a', '#ff3b30'];
            seriesPointsList.innerHTML = res.points.map((pt, i) => `
                <div class="point-row-item">
                    <div class="point-row-left">
                        <span class="point-row-dot" style="background: ${colors[i % colors.length]};"></span>
                        <span class="point-row-param">${res.paramVar} = ${pt.k}</span>
                        <span class="point-row-expr">${pt.label}</span>
                    </div>
                    <div class="point-row-right">
                        <span class="point-row-angle">≈ ${pt.degrees}°</span>
                        <span class="point-row-quad">${pt.quadrant} четв.</span>
                    </div>
                </div>
            `).join('');
        }
    }

    // Segmented Mode Switching
    if (modeInlineBtn) modeInlineBtn.addEventListener('click', () => switchMode('inline'));
    if (modeFractionBtn) modeFractionBtn.addEventListener('click', () => switchMode('fraction'));
    if (modeSeriesBtn) modeSeriesBtn.addEventListener('click', () => switchMode('series'));

    // Inline input events (auto-detect series expressions like -α + 2πn)
    if (inlineInput) {
        inlineInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (TrigEngine.isSeriesExpression(val)) {
                seriesExpr = val;
                if (seriesInput) seriesInput.value = val;
                switchMode('series');
                return;
            }
            updateFromExpression(val);
        });
    }

    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', () => {
            if (inlineInput) inlineInput.value = '';
            updateFromExpression('');
            if (inlineInput) inlineInput.focus();
        });
    }

    // Series Input Events
    if (seriesInput) {
        seriesInput.addEventListener('input', (e) => {
            updateSeries(e.target.value, seriesAlpha);
        });
    }

    if (clearSeriesBtn) {
        clearSeriesBtn.addEventListener('click', () => {
            if (seriesInput) seriesInput.value = '';
            updateSeries('', seriesAlpha);
            if (seriesInput) seriesInput.focus();
        });
    }

    // Preset Task Buttons (Tasks 1-4 from textbook)
    document.querySelectorAll('.series-task-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.series-task-pill').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.mini-task-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const taskSeries = btn.getAttribute('data-series');
            if (seriesInput) seriesInput.value = taskSeries;
            updateSeries(taskSeries, seriesAlpha);
        });
    });

    document.querySelectorAll('.mini-task-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.series-task-pill').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.mini-task-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const taskSeries = btn.getAttribute('data-series');
            if (seriesInput) seriesInput.value = taskSeries;
            updateSeries(taskSeries, seriesAlpha);
        });
    });

    // Quick symbol toolbar buttons for series
    document.querySelectorAll('.quick-series-sym').forEach(btn => {
        btn.addEventListener('click', () => {
            const sym = btn.getAttribute('data-sym');
            if (!seriesInput) return;

            if (sym === '-') {
                if (seriesInput.value.startsWith('-')) {
                    seriesInput.value = seriesInput.value.substring(1);
                } else {
                    seriesInput.value = '-' + seriesInput.value;
                }
            } else {
                seriesInput.value += sym;
            }
            updateSeries(seriesInput.value, seriesAlpha);
            seriesInput.focus();
        });
    });

    // Reference Angle α Slider & Controls
    if (alphaSlider) {
        alphaSlider.addEventListener('input', (e) => {
            const deg = parseInt(e.target.value);
            seriesAlpha = deg;
            if (alphaValueDisplay) alphaValueDisplay.textContent = `${deg}°`;
            if (alphaInputField && document.activeElement !== alphaInputField) alphaInputField.value = deg;
            document.querySelectorAll('.alpha-chip').forEach(c => {
                c.classList.toggle('active', parseInt(c.getAttribute('data-deg')) === deg);
            });
            updateSeries(seriesExpr, seriesAlpha);
        });
    }

    if (alphaInputField) {
        alphaInputField.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                const deg = Math.max(1, Math.min(89, Math.round(val)));
                seriesAlpha = deg;
                if (alphaSlider) alphaSlider.value = deg;
                if (alphaValueDisplay) alphaValueDisplay.textContent = `${deg}°`;
                document.querySelectorAll('.alpha-chip').forEach(c => {
                    c.classList.toggle('active', parseInt(c.getAttribute('data-deg')) === deg);
                });
                updateSeries(seriesExpr, seriesAlpha);
            }
        });
        alphaInputField.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const step = e.shiftKey ? 5 : 1;
                const next = Math.min(89, seriesAlpha + step);
                seriesAlpha = next;
                if (alphaSlider) alphaSlider.value = next;
                alphaInputField.value = next;
                if (alphaValueDisplay) alphaValueDisplay.textContent = `${next}°`;
                document.querySelectorAll('.alpha-chip').forEach(c => {
                    c.classList.toggle('active', parseInt(c.getAttribute('data-deg')) === next);
                });
                updateSeries(seriesExpr, seriesAlpha);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const step = e.shiftKey ? 5 : 1;
                const next = Math.max(1, seriesAlpha - step);
                seriesAlpha = next;
                if (alphaSlider) alphaSlider.value = next;
                alphaInputField.value = next;
                if (alphaValueDisplay) alphaValueDisplay.textContent = `${next}°`;
                document.querySelectorAll('.alpha-chip').forEach(c => {
                    c.classList.toggle('active', parseInt(c.getAttribute('data-deg')) === next);
                });
                updateSeries(seriesExpr, seriesAlpha);
            }
        });
    }

    document.querySelectorAll('.alpha-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const deg = parseInt(chip.getAttribute('data-deg'));
            seriesAlpha = deg;
            if (alphaSlider) alphaSlider.value = deg;
            if (alphaValueDisplay) alphaValueDisplay.textContent = `${deg}°`;
            if (alphaInputField) alphaInputField.value = deg;
            document.querySelectorAll('.alpha-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            updateSeries(seriesExpr, seriesAlpha);
        });
    });

    if (toggleAlphaRefBtn) {
        toggleAlphaRefBtn.addEventListener('click', () => {
            seriesShowAlphaRef = !seriesShowAlphaRef;
            toggleAlphaRefBtn.classList.toggle('active', seriesShowAlphaRef);
            if (circleCanvas) {
                circleCanvas.showAlphaReference = seriesShowAlphaRef;
                circleCanvas.render();
            }
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

    // Angle Slider & Direct Degree Input
    if (slider) {
        slider.addEventListener('input', (e) => {
            updateFromDegrees(parseFloat(e.target.value));
        });
    }

    if (degreeInputField) {
        degreeInputField.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                updateFromDegrees(val);
            }
        });
        degreeInputField.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const step = e.shiftKey ? 15 : 1;
                updateFromDegrees(sliderDegrees + step);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const step = e.shiftKey ? 15 : 1;
                updateFromDegrees(sliderDegrees - step);
            } else if (e.key === 'Enter') {
                degreeInputField.blur();
            }
        });
    }

    // Quick Steppers
    if (stepperMinus360) stepperMinus360.addEventListener('click', () => updateFromDegrees(sliderDegrees - 360));
    if (stepperMinus90) stepperMinus90.addEventListener('click', () => updateFromDegrees(sliderDegrees - 90));
    if (stepperZero) stepperZero.addEventListener('click', () => updateFromDegrees(0));
    if (stepperPlus90) stepperPlus90.addEventListener('click', () => updateFromDegrees(sliderDegrees + 90));
    if (stepperPlus360) stepperPlus360.addEventListener('click', () => updateFromDegrees(sliderDegrees + 360));

    // Reset Button
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (inputMode === 'series') {
                seriesExpr = '-α + 2πn, n ∈ Z';
                seriesAlpha = 35;
                if (seriesInput) seriesInput.value = seriesExpr;
                if (alphaSlider) alphaSlider.value = 35;
                if (alphaInputField) alphaInputField.value = 35;
                if (alphaValueDisplay) alphaValueDisplay.textContent = '35°';
                document.querySelectorAll('.series-task-pill').forEach((p, idx) => p.classList.toggle('active', idx === 0));
                document.querySelectorAll('.mini-task-chip').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.alpha-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-deg') === '35'));
                updateSeries(seriesExpr, seriesAlpha);
            } else {
                if (degreeInputField) degreeInputField.value = 0;
                updateFromDegrees(0);
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

    // Copy Solution to Clipboard (Single Angle or Series)
    if (copySolutionBtn) {
        copySolutionBtn.addEventListener('click', () => {
            let text = '';
            if (inputMode === 'series' && currentSeriesResult && currentSeriesResult.isValid) {
                text = currentSeriesResult.fullSolutionText + `\n\nРазработано: @slawastr 1-26 design`;
            } else {
                const expr = (inlineInput ? inlineInput.value : rawInputText) || '3π/4';
                const res = TrigEngine.calculate(expr);
                if (!res.isValid) return;

                text = `📐 Решение задания с тригонометрическим кругом:\n`;
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
            }

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

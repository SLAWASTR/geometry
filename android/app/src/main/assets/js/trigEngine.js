/**
 * Математический движок для тригонометрического круга
 * Автор: @slawastr 1-26 design
 */

class TrigEngine {
    static gcd(a, b) {
        let x = Math.abs(a);
        let y = Math.abs(b);
        while (y !== 0) {
            let temp = x % y;
            x = y;
            y = temp;
        }
        return x;
    }

    static formatDegree(val) {
        const rounded = Math.round(val * 100) / 100;
        if (Math.floor(rounded) === rounded) {
            return `${Math.round(rounded)}°`;
        } else {
            return `${rounded.toFixed(1)}°`;
        }
    }

    static parseNumerator(raw) {
        let str = (raw || '').trim();
        if (!str) return { value: null, isInt: false, intVal: null };

        let sign = 1.0;
        if (str.startsWith('-') || str.startsWith('−')) {
            sign = -1.0;
            str = str.substring(1);
        } else if (str.startsWith('+')) {
            str = str.substring(1);
        }

        if (!str) return { value: null, isInt: false, intVal: null };

        if (str === 'π') {
            return { value: sign * 1.0, isInt: true, intVal: Math.round(sign * 1) };
        }

        if (str.includes('π')) {
            let cleaned = str.replace(/\*π/g, '').replace(/π\*/g, '').replace(/π/g, '');
            if (!cleaned) {
                return { value: sign * 1.0, isInt: true, intVal: Math.round(sign * 1) };
            }
            let num = parseFloat(cleaned);
            if (!isNaN(num)) {
                let isInt = Math.floor(num) === num;
                return { value: sign * num, isInt: isInt, intVal: isInt ? Math.round(sign * num) : null };
            }
            return { value: null, isInt: false, intVal: null };
        } else {
            let num = parseFloat(str);
            if (!isNaN(num)) {
                let isInt = Math.floor(num) === num;
                return { value: sign * num, isInt: isInt, intVal: isInt ? Math.round(sign * num) : null };
            }
            return { value: null, isInt: false, intVal: null };
        }
    }

    static calculate(input) {
        const trimmed = (input || '').trim();
        if (!trimmed) {
            return this.emptyResult();
        }

        // Normalize characters: Russian п/пи, English pi, unicode π
        let s = trimmed
            .replace(/−/g, '-')
            .replace(/ПИ/gi, 'π')
            .replace(/Пи/gi, 'π')
            .replace(/пи/gi, 'π')
            .replace(/П/gi, 'π')
            .replace(/п/gi, 'π')
            .replace(/PI/gi, 'π')
            .replace(/Pi/gi, 'π')
            .replace(/pi/gi, 'π')
            .replace(/ /g, '')
            .replace(/,/g, '.');

        // Direct degrees e.g. 135°, -90°, 45град or plain numbers like 135, -45, 300
        if (s.includes('°') || s.endsWith('град') || s.endsWith('deg')) {
            let numPart = s.replace(/°/g, '').replace(/град/g, '').replace(/deg/g, '');
            let degVal = parseFloat(numPart);
            if (!isNaN(degVal)) {
                return this.buildResult({
                    rawInput: input,
                    hasPi: false,
                    isFraction: false,
                    numeratorExact: null,
                    denominatorExact: null,
                    radians: (degVal * Math.PI) / 180.0,
                    degrees: degVal
                });
            }
        }

        // Direct numbers without slash or pi (e.g. 135, -90, 45, 720) -> treat as degrees directly
        if (!s.includes('/') && !s.includes('π')) {
            let directDeg = parseFloat(s);
            if (!isNaN(directDeg)) {
                return this.buildResult({
                    rawInput: input,
                    hasPi: false,
                    isFraction: false,
                    numeratorExact: null,
                    denominatorExact: null,
                    radians: (directDeg * Math.PI) / 180.0,
                    degrees: directDeg
                });
            }
        }

        const hasPi = s.includes('π');
        let numeratorExact = null;
        let denominatorExact = null;
        let isFraction = false;
        let degrees = 0;
        let radians = 0;

        if (s.includes('/')) {
            const parts = s.split('/');
            if (parts.length !== 2) {
                return this.errorResult(input, 'Неверный формат дроби. Используйте a/b или a*π/b');
            }

            const numStr = parts[0];
            const denStr = parts[1];

            if (!denStr) {
                return this.errorResult(input, 'Знаменатель дроби не указан');
            }

            const denVal = parseFloat(denStr);
            if (isNaN(denVal) || denVal === 0) {
                if (denVal === 0) return this.errorResult(input, 'Деление на ноль невозможно!');
                return this.errorResult(input, `Знаменатель должен быть числом: '${denStr}'`);
            }

            const numParse = this.parseNumerator(numStr);
            if (numParse.value === null) {
                return this.errorResult(input, `Не удалось распознать числитель: '${numStr}'`);
            }

            isFraction = true;
            const denIsInt = Math.floor(denVal) === denVal;
            if (numParse.isInt && denIsInt) {
                numeratorExact = numParse.intVal;
                denominatorExact = Math.round(denVal);
            }

            if (hasPi) {
                radians = (numParse.value * Math.PI) / denVal;
                degrees = (numParse.value * 180.0) / denVal;
            } else {
                radians = numParse.value / denVal;
                degrees = (radians * 180.0) / Math.PI;
            }
        } else {
            const numParse = this.parseNumerator(s);
            if (numParse.value === null) {
                return this.errorResult(input, `Не удалось распознать число: '${s}'`);
            }

            if (hasPi) {
                radians = numParse.value * Math.PI;
                degrees = numParse.value * 180.0;
                if (numParse.isInt) {
                    numeratorExact = numParse.intVal;
                    denominatorExact = 1;
                    isFraction = true;
                }
            } else {
                radians = numParse.value;
                degrees = (radians * 180.0) / Math.PI;
            }
        }

        return this.buildResult({
            rawInput: input,
            hasPi,
            isFraction,
            numeratorExact,
            denominatorExact,
            radians,
            degrees
        });
    }

    static emptyResult() {
        return {
            rawInput: '',
            isValid: false,
            errorMessage: 'Введите угол в радианах',
            isFraction: false,
            numerator: null,
            denominator: null,
            hasPi: false,
            radians: 0,
            degrees: 0,
            normalizedDegrees: 0,
            turns: 0,
            isPositive: true,
            quadrant: { type: 'axis', title: 'На оси (+Ox)', shortName: '+Ox', isAxis: true },
            nearestTickSummary: '',
            nearestTicks: [360],
            distanceToNearestTick: 0,
            trigValues: this.computeTrigValues(0),
            parity: this.computeParityInfo(0, this.computeTrigValues(0)),
            steps: []
        };
    }

    static errorResult(input, message) {
        const res = this.emptyResult();
        res.rawInput = input;
        res.isValid = false;
        res.errorMessage = message;
        return res;
    }

    static buildResult({ rawInput, hasPi, isFraction, numeratorExact, denominatorExact, radians, degrees }) {
        const isPositive = degrees >= 0;

        // Normalization to [0, 360)
        let norm = degrees % 360.0;
        if (norm < 0) {
            norm += 360.0;
        }
        if (Math.abs(norm - 360.0) < 1e-9 || Math.abs(norm) < 1e-9) {
            norm = 0.0;
        }

        // Full revolutions
        const turns = Math.floor(degrees / 360.0);

        // Quadrant & Axis
        let quadrant = null;
        const eps = 1e-5;

        if (Math.abs(norm - 0.0) < eps || Math.abs(norm - 360.0) < eps) {
            quadrant = { type: 'axis', title: 'На оси (+Ox)', shortName: '+Ox', isAxis: true, desc: 'Положительная полуось Ox (0° / 360°)' };
        } else if (Math.abs(norm - 90.0) < eps) {
            quadrant = { type: 'axis', title: 'На оси (+Oy)', shortName: '+Oy', isAxis: true, desc: 'Положительная полуось Oy (90°)' };
        } else if (Math.abs(norm - 180.0) < eps) {
            quadrant = { type: 'axis', title: 'На оси (-Ox)', shortName: '-Ox', isAxis: true, desc: 'Отрицательная полуось Ox (180°)' };
        } else if (Math.abs(norm - 270.0) < eps) {
            quadrant = { type: 'axis', title: 'На оси (-Oy)', shortName: '-Oy', isAxis: true, desc: 'Отрицательная полуось Oy (270°)' };
        } else if (norm > 0 && norm < 90) {
            quadrant = { type: 'quadrant', number: 1, title: 'I четверть', shortName: 'I', isAxis: false, desc: 'Между 0° и 90°' };
        } else if (norm > 90 && norm < 180) {
            quadrant = { type: 'quadrant', number: 2, title: 'II четверть', shortName: 'II', isAxis: false, desc: 'Между 90° и 180°' };
        } else if (norm > 180 && norm < 270) {
            quadrant = { type: 'quadrant', number: 3, title: 'III четверть', shortName: 'III', isAxis: false, desc: 'Между 180° и 270°' };
        } else {
            quadrant = { type: 'quadrant', number: 4, title: 'IV четверть', shortName: 'IV', isAxis: false, desc: 'Между 270° и 360°' };
        }

        // Nearest Tick among [90, 180, 270, 360]
        const ticks = [90, 180, 270, 360];
        let minDistance = 360.0;
        let tickDistances = [];

        for (let t of ticks) {
            let diff = Math.abs(norm - t);
            let circDist = Math.min(diff, 360.0 - diff);
            tickDistances.push({ tick: t, dist: circDist });
            if (circDist < minDistance) {
                minDistance = circDist;
            }
        }

        const nearestTicks = tickDistances
            .filter(item => Math.abs(item.dist - minDistance) < 1e-4)
            .map(item => item.tick)
            .sort((a, b) => a - b);

        let nearestSummary = '';
        const formattedDist = this.formatDegree(minDistance);

        if (minDistance < 1e-5) {
            nearestSummary = `Находится ровно на засечке ${nearestTicks[0] || 360}°`;
        } else if (nearestTicks.length === 2) {
            nearestSummary = `одинаково близко к ${nearestTicks[0]}° и ${nearestTicks[1]}° (расстояние ${formattedDist})`;
        } else if (nearestTicks.length === 1) {
            nearestSummary = `ближе к ${nearestTicks[0]}° (расстояние ${formattedDist})`;
        } else {
            nearestSummary = `расстояние до засечки ${formattedDist}`;
        }

        // Exact Trigonometry
        const trigValues = this.computeTrigValues(norm);

        // Parity of Trig Functions
        const parity = this.computeParityInfo(degrees, trigValues);

        // Educational Steps
        const steps = this.generateSteps({
            rawInput,
            hasPi,
            num: numeratorExact,
            den: denominatorExact,
            radians,
            degrees,
            norm,
            turns,
            quadrant,
            nearestTicks,
            minDist: minDistance,
            nearestSummary,
            trig: trigValues,
            parity
        });

        return {
            rawInput,
            isValid: true,
            errorMessage: null,
            isFraction,
            numerator: numeratorExact,
            denominator: denominatorExact,
            hasPi,
            radians,
            degrees,
            normalizedDegrees: norm,
            turns,
            isPositive,
            quadrant,
            nearestTickSummary: nearestSummary,
            nearestTicks,
            distanceToNearestTick: minDistance,
            trigValues,
            parity,
            steps
        };
    }

    static computeTrigValues(normDeg) {
        const rad = (normDeg * Math.PI) / 180.0;
        const sinVal = Math.sin(rad);
        const cosVal = Math.cos(rad);
        const tanVal = Math.abs(cosVal) < 1e-9 ? null : Math.tan(rad);
        const cotVal = Math.abs(sinVal) < 1e-9 ? null : 1.0 / Math.tan(rad);

        const intDeg = Math.round(normDeg);
        const isInt = Math.abs(normDeg - intDeg) < 1e-5;

        let sinStr = sinVal.toFixed(3);
        let cosStr = cosVal.toFixed(3);
        let tanStr = tanVal !== null ? tanVal.toFixed(3) : 'не существует';
        let cotStr = cotVal !== null ? cotVal.toFixed(3) : 'не существует';

        if (isInt) {
            const deg = ((intDeg % 360) + 360) % 360;
            switch (deg) {
                case 0: sinStr = '0'; cosStr = '1'; tanStr = '0'; cotStr = 'не сущ.'; break;
                case 30: sinStr = '1/2'; cosStr = '√3/2'; tanStr = '√3/3'; cotStr = '√3'; break;
                case 45: sinStr = '√2/2'; cosStr = '√2/2'; tanStr = '1'; cotStr = '1'; break;
                case 60: sinStr = '√3/2'; cosStr = '1/2'; tanStr = '√3'; cotStr = '√3/3'; break;
                case 90: sinStr = '1'; cosStr = '0'; tanStr = 'не сущ.'; cotStr = '0'; break;
                case 120: sinStr = '√3/2'; cosStr = '-1/2'; tanStr = '-√3'; cotStr = '-√3/3'; break;
                case 135: sinStr = '√2/2'; cosStr = '-√2/2'; tanStr = '-1'; cotStr = '-1'; break;
                case 150: sinStr = '1/2'; cosStr = '-√3/2'; tanStr = '-√3/3'; cotStr = '-√3'; break;
                case 180: sinStr = '0'; cosStr = '-1'; tanStr = '0'; cotStr = 'не сущ.'; break;
                case 210: sinStr = '-1/2'; cosStr = '-√3/2'; tanStr = '√3/3'; cotStr = '√3'; break;
                case 225: sinStr = '-√2/2'; cosStr = '-√2/2'; tanStr = '1'; cotStr = '1'; break;
                case 240: sinStr = '-√3/2'; cosStr = '-1/2'; tanStr = '√3'; cotStr = '√3/3'; break;
                case 270: sinStr = '-1'; cosStr = '0'; tanStr = 'не сущ.'; cotStr = '0'; break;
                case 300: sinStr = '-√3/2'; cosStr = '1/2'; tanStr = '-√3'; cotStr = '-√3/3'; break;
                case 315: sinStr = '-√2/2'; cosStr = '√2/2'; tanStr = '-1'; cotStr = '-1'; break;
                case 330: sinStr = '-1/2'; cosStr = '√3/2'; tanStr = '-√3/3'; cotStr = '-√3'; break;
            }
        }

        return {
            sinExact: sinStr,
            cosExact: cosStr,
            tanExact: tanStr,
            cotExact: cotStr,
            sinApprox: sinVal,
            cosApprox: cosVal,
            tanApprox: tanVal,
            cotApprox: cotVal
        };
    }

    static computeParityInfo(degrees, trigValues) {
        const degStr = this.formatDegree(degrees).replace(/^-/, '−');
        const negDeg = -degrees;
        const negDegStr = this.formatDegree(negDeg).replace(/^-/, '−');

        const normNeg = ((negDeg % 360.0) + 360.0) % 360.0;
        const negTrig = this.computeTrigValues(normNeg);

        let cosCalc = '';
        let sinCalc = '';
        let tanCalc = '';
        let cotCalc = '';

        if (Math.abs(degrees) < 1e-5) {
            cosCalc = `cos(−0°) = cos(0°) = 1`;
            sinCalc = `sin(−0°) = −sin(0°) = 0`;
            tanCalc = `tg(−0°) = −tg(0°) = 0`;
            cotCalc = `ctg(−0°): не существует`;
        } else if (degrees < 0) {
            // Negative angle input e.g. -135° -> -x is +135°
            cosCalc = `cos(${degStr}) = cos(${negDegStr}) = ${trigValues.cosExact}`;
            sinCalc = `sin(${degStr}) = −sin(${negDegStr}) = ${trigValues.sinExact}`;
            if (trigValues.tanExact === 'не сущ.' || trigValues.tanExact === 'не существует') {
                tanCalc = `tg(${degStr}): не существует`;
            } else {
                tanCalc = `tg(${degStr}) = −tg(${negDegStr}) = ${trigValues.tanExact}`;
            }
            if (trigValues.cotExact === 'не сущ.' || trigValues.cotExact === 'не существует') {
                cotCalc = `ctg(${degStr}): не существует`;
            } else {
                cotCalc = `ctg(${degStr}) = −ctg(${negDegStr}) = ${trigValues.cotExact}`;
            }
        } else {
            // Positive angle input e.g. 135° -> -x is -135°
            cosCalc = `cos(−${degStr}) = cos(${degStr}) = ${trigValues.cosExact}`;
            sinCalc = `sin(−${degStr}) = −sin(${degStr}) = ${negTrig.sinExact}`;
            if (trigValues.tanExact === 'не сущ.' || trigValues.tanExact === 'не существует') {
                tanCalc = `tg(−${degStr}): не существует`;
            } else {
                tanCalc = `tg(−${degStr}) = −tg(${degStr}) = ${negTrig.tanExact}`;
            }
            if (trigValues.cotExact === 'не сущ.' || trigValues.cotExact === 'не существует') {
                cotCalc = `ctg(−${degStr}): не существует`;
            } else {
                cotCalc = `ctg(−${degStr}) = −ctg(${degStr}) = ${negTrig.cotExact}`;
            }
        }

        return {
            degStr,
            negDegStr,
            cosCalc,
            sinCalc,
            tanCalc,
            cotCalc,
            negTrig
        };
    }

    static generateSteps({ hasPi, num, den, radians, degrees, norm, turns, quadrant, nearestTicks, minDist, nearestSummary, trig, parity }) {
        const steps = [];
        let stepNum = 1;

        const degStr = this.formatDegree(degrees);
        const normStr = this.formatDegree(norm);

        // STEP 1: Radians to Degrees
        let s1Explanation = '';
        if (hasPi && num !== null && den !== null) {
            const signStr = num < 0 ? '−' : '';
            const absA = Math.abs(num);
            if (den === 1) {
                s1Explanation = `Подставляем значение π = 180°:\n${num}π = ${num} · 180° = ${degStr}.`;
            } else if (180 % den === 0) {
                const div = 180 / den;
                s1Explanation = `Подставляем π = 180° и сокращаем знаменатель:\n${signStr}(${absA} · 180°) / ${den} = ${signStr}${absA} · (180° / ${den}) = ${signStr}${absA} · ${div}° = ${degStr}.`;
            } else {
                const totalNum = absA * 180;
                s1Explanation = `Подставляем π = 180°:\n${signStr}(${absA} · 180°) / ${den} = ${signStr}${totalNum}° / ${den} = ${degStr}.`;
            }
        } else if (hasPi) {
            const mult = degrees / 180.0;
            s1Explanation = `Подставляем π = 180°:\n${mult.toFixed(3)} · 180° = ${degStr}.`;
        } else {
            s1Explanation = `Умножаем значение угла в радианах на коэффициент (180° / π):\n${radians.toFixed(4)} · (180° / 3.14159...) = ${degStr}.`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: 'Перевод из радиан в градусы',
            summary: `Полученный угол: ${degStr}`,
            formula: 'α° = α(рад) · (180° / π)',
            explanation: s1Explanation
        });

        // STEP 2: Turns and Direction
        let s2Explanation = '';
        let s2Formula = null;
        if (degrees >= 0 && degrees < 360) {
            s2Explanation = `Угол положительный (${degStr} ≥ 0°), поэтому луч откладывается от оси Ox против часовой стрелки.\nУгол уже находится в базовом диапазоне от 0° до 360° (0 полных оборотов).`;
        } else if (degrees >= 360) {
            const k = turns;
            const kRev = k === 1 ? '1 полный оборот' : `${k} полных оборота(ов)`;
            s2Formula = 'α₀ = α − 360° · k';
            s2Explanation = `Угол ${degStr} превышает полный круг (360°).\nЛуч совершает ${kRev} против часовой стрелки:\n${degStr} − ${k} · 360° = ${degStr} − ${k * 360}° = ${normStr}.\nКонечное положение луча соответствует углу ${normStr}.`;
        } else {
            const k = Math.abs(turns);
            const kRev = k === 1 ? '1 оборот' : `${k} оборота(ов)`;
            s2Formula = 'α₀ = α + 360° · k';
            s2Explanation = `Угол отрицательный (${degStr} < 0°), поэтому отсчёт ведётся по часовой стрелке.\nПрибавляем полные обороты (${kRev}):\n${degStr} + ${k} · 360° = ${degStr} + ${k * 360}° = ${normStr}.\nПриведенный угол на круге: ${normStr}.`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: 'Направление вращения и полные обороты',
            summary: degrees >= 0 && degrees < 360 ? 'Стандартный диапазон [0°, 360°)' : `После приведения: ${normStr}`,
            formula: s2Formula,
            explanation: s2Explanation
        });

        // PARITY STEP FOR NEGATIVE ANGLES
        if (degrees < 0 && parity) {
            steps.push({
                stepNumber: stepNum++,
                title: 'Чётность тригонометрических функций',
                summary: 'cos(−x) = cos(x), sin(−x) = −sin(x)',
                formula: 'cos(−x) = cos(x) | sin(−x) = −sin(x) | tg(−x) = −tg(x) | ctg(−x) = −ctg(x)',
                explanation: `Так как исходный угол отрицательный (${degStr} < 0°), применяем фундаментальные свойства чётности функций:\n` +
                    `1. Косинус — ЧЁТНАЯ функция: знак «минус» уничтожается (поглощается):\n` +
                    `   ${parity.cosCalc}\n` +
                    `2. Синус — НЕЧЁТНАЯ функция: знак «минус» выносится вперед:\n` +
                    `   ${parity.sinCalc}\n` +
                    `3. Тангенс — НЕЧЁТНАЯ функция: знак «минус» выносится вперед:\n` +
                    `   ${parity.tanCalc}\n` +
                    `4. Котангенс — НЕЧЁТНАЯ функция: знак «минус» выносится вперед:\n` +
                    `   ${parity.cotCalc}\n\n` +
                    `Геометрически: на единичной окружности точка ${degStr} симметрична точке ${parity.negDegStr} относительно горизонтальной оси Ox (одинаковая абсцисса x = cos, противоположные ординаты y = ±sin).`
            });
        }

        // STEP 3: Quadrant
        let s3Explanation = '';
        if (quadrant.isAxis) {
            s3Explanation = `Угол равен ${normStr}, поэтому луч совпадает с осью координат (${quadrant.desc}).\nВнимание: если конечная сторона лежит непосредственно на оси, угол НЕ относится ни к какой четверти!`;
        } else {
            s3Explanation = `Сравниваем угол с границами: ${quadrant.desc}.\nУгол находится в ${quadrant.title} координатной плоскости.`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: 'Определение четверти',
            summary: quadrant.title,
            formula: 'I: (0°, 90°) | II: (90°, 180°) | III: (180°, 270°) | IV: (270°, 360°)',
            explanation: s3Explanation
        });

        // STEP 4: Nearest Tick
        let s4Explanation = `Проверяем расстояния от приведенного угла ${normStr} до ключевых засечек 90°, 180°, 270° и 360°:\n`;
        const d90 = Math.min(Math.abs(norm - 90), 360 - Math.abs(norm - 90));
        const d180 = Math.abs(norm - 180);
        const d270 = Math.min(Math.abs(norm - 270), 360 - Math.abs(norm - 270));
        const d360 = Math.min(norm, 360 - norm);

        s4Explanation += `• До 90°: ${this.formatDegree(d90)}\n`;
        s4Explanation += `• До 180°: ${this.formatDegree(d180)}\n`;
        s4Explanation += `• До 270°: ${this.formatDegree(d270)}\n`;
        s4Explanation += `• До 360°: ${this.formatDegree(d360)}\n\n`;

        if (nearestTicks.length === 2) {
            s4Explanation += `Минимальное расстояние ${this.formatDegree(minDist)} достигается одновременно для засечек ${nearestTicks[0]}° и ${nearestTicks[1]}°.`;
        } else if (nearestTicks.length === 1) {
            s4Explanation += `Минимальное расстояние равно ${this.formatDegree(minDist)} до засечки ${nearestTicks[0]}°.`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: 'Ближайшая засечка на круге',
            summary: nearestSummary,
            formula: null,
            explanation: s4Explanation
        });

        // STEP 5: Coordinates & Parity
        let s5Explanation = `Координаты точки на единичной окружности:\n• x = cos(${normStr}) = ${trig.cosExact}\n• y = sin(${normStr}) = ${trig.sinExact}\n• tg(${normStr}) = ${trig.tanExact}\n• ctg(${normStr}) = ${trig.cotExact}`;
        if (parity) {
            s5Explanation += `\n\nСвойства чётности тригонометрических функций:\n• ${parity.cosCalc} (чётная • поглощает минус)\n• ${parity.sinCalc} (нечётная • выносит минус)\n• ${parity.tanCalc} (нечётная • выносит минус)\n• ${parity.cotCalc} (нечётная • выносит минус)`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: 'Точные значения и чётность функций',
            summary: `sin = ${trig.sinExact}, cos = ${trig.cosExact}`,
            formula: 'x = cos(α), y = sin(α)',
            explanation: s5Explanation
        });

        return steps;
    }

    // ==========================================
    // СЕРИИ УГЛОВ С ПАРАМЕТРОМ α (Задание №6)
    // ==========================================

    static isSeriesExpression(raw) {
        if (!raw) return false;
        const str = raw.trim().toLowerCase();
        if (str.includes('α') || str.includes('alpha') || str.includes('альфа')) return true;
        if (str.includes('∈') || str.includes('in z') || str.includes('∈z') || str.includes('∈ z')) return true;
        if (/(^|[^a-zа-я0-9_])[aа]([^a-zа-я0-9_]|$)/i.test(str) && (str.includes('π') || str.includes('pi') || str.includes('п'))) return true;
        if (/π\s*[\*]?\s*[nklm]/i.test(str) || /[nklm]\s*[\*]?\s*π/i.test(str)) return true;
        return false;
    }

    static calculateSeries(rawInput, alphaDeg = 35) {
        const trimmed = (rawInput || '').trim();
        if (!trimmed) {
            return this.emptySeriesResult();
        }

        let s = trimmed
            .replace(/,\s*[a-zA-Zа-яА-Я]\s*(∈|in|\u2208)\s*(Z|ℤ)/gi, '')
            .replace(/−/g, '-')
            .replace(/ПИ/gi, 'π').replace(/Пи/gi, 'π').replace(/пи/gi, 'π')
            .replace(/П/gi, 'π').replace(/п/gi, 'π').replace(/pi/gi, 'π').replace(/PI/gi, 'π')
            .replace(/альфа/gi, 'α').replace(/alpha/gi, 'α')
            .replace(/(^|[^a-zA-Zа-яА-Я0-9_])([aа])([^a-zA-Zа-яА-Я0-9_]|$)/g, '$1α$3')
            .replace(/\s+/g, '');

        // Parameter variable (n, l, k, m)
        let varMatch = s.match(/[nklm]/i);
        let paramVar = varMatch ? varMatch[0].toLowerCase() : 'k';

        // Alpha presence and sign
        let hasAlpha = s.includes('α');
        let alphaSign = 0;
        if (hasAlpha) {
            let idx = s.indexOf('α');
            if (idx > 0 && s[idx - 1] === '-') {
                alphaSign = -1;
            } else {
                alphaSign = 1;
            }
        }

        // Offset (e.g. π - α, π/2 - α, 3π/2 - α)
        let offsetDeg = 0;
        let offsetExpr = '';
        if (s.includes('π/2-α') || s.includes('π/2+α') || s.includes('90°-α')) {
            offsetDeg = 90;
            offsetExpr = 'π/2';
        } else if (s.includes('3π/2-α') || s.includes('3π/2+α') || s.includes('270°-α')) {
            offsetDeg = 270;
            offsetExpr = '3π/2';
        } else if (s.includes('π-α') || s.includes('π+α') || s.includes('180°-α')) {
            offsetDeg = 180;
            offsetExpr = 'π';
        }

        // Detect period
        let cleanPeriod = s.replace(/^[+-]?α/, '').replace(/[+-]α/, '');
        if (offsetExpr) {
            cleanPeriod = cleanPeriod.replace(offsetExpr, '');
        }
        cleanPeriod = cleanPeriod.replace(/^\+/, '').replace(/\+$/, '');

        let periodDeg = 360;
        let periodExpr = '2π';

        if (cleanPeriod.includes('π/4') || cleanPeriod.includes('(π/4)') || cleanPeriod.includes('π' + paramVar + '/4') || cleanPeriod.includes('45°')) {
            periodDeg = 45;
            periodExpr = 'π/4';
        } else if (cleanPeriod.includes('π/2') || cleanPeriod.includes('(π/2)') || cleanPeriod.includes('π' + paramVar + '/2') || cleanPeriod.includes('90°')) {
            periodDeg = 90;
            periodExpr = 'π/2';
        } else if (cleanPeriod.includes('2π/3') || cleanPeriod.includes('(2π/3)') || cleanPeriod.includes('2π' + paramVar + '/3') || cleanPeriod.includes('120°')) {
            periodDeg = 120;
            periodExpr = '2π/3';
        } else if (cleanPeriod.includes('π/3') || cleanPeriod.includes('(π/3)') || cleanPeriod.includes('π' + paramVar + '/3') || cleanPeriod.includes('60°')) {
            periodDeg = 60;
            periodExpr = 'π/3';
        } else if (cleanPeriod.includes('π/6') || cleanPeriod.includes('(π/6)') || cleanPeriod.includes('π' + paramVar + '/6') || cleanPeriod.includes('30°')) {
            periodDeg = 30;
            periodExpr = 'π/6';
        } else if (cleanPeriod.includes('3π/4') || cleanPeriod.includes('(3π/4)') || cleanPeriod.includes('135°')) {
            periodDeg = 135;
            periodExpr = '3π/4';
        } else if (cleanPeriod.includes('2π') || cleanPeriod.includes('2*π') || cleanPeriod.includes('360°')) {
            periodDeg = 360;
            periodExpr = '2π';
        } else if (cleanPeriod.includes('π') || cleanPeriod.includes('180°')) {
            periodDeg = 180;
            periodExpr = 'π';
        }

        const numPoints = Math.round(360 / periodDeg);
        const points = [];
        const quadrantsSet = new Set();

        const baseAngleName = alphaSign === -1 ? '-α' : (alphaSign === 1 ? 'α' : (offsetExpr || '0'));
        const fullBaseExpr = offsetExpr ? (alphaSign === -1 ? `${offsetExpr} - α` : `${offsetExpr} + α`) : baseAngleName;

        for (let i = 0; i < numPoints; i++) {
            let deg = (offsetDeg + alphaSign * alphaDeg + i * periodDeg) % 360;
            if (deg < 0) deg += 360;
            deg = Math.round(deg * 10) / 10;

            let quad = '';
            if (deg > 0 && deg < 90) quad = 'I';
            else if (deg > 90 && deg < 180) quad = 'II';
            else if (deg > 180 && deg < 270) quad = 'III';
            else if (deg > 270 && deg < 360) quad = 'IV';
            else quad = 'на оси';

            if (quad !== 'на оси') quadrantsSet.add(quad);

            // Symbolic step label
            let symLabel = '';
            if (i === 0) {
                symLabel = fullBaseExpr;
            } else {
                let stepPart = '';
                if (periodExpr === '2π') stepPart = `2π`;
                else if (periodExpr === 'π') stepPart = (i === 1 ? 'π' : `${i}π`);
                else if (periodExpr === 'π/2') {
                    if (i === 1) stepPart = 'π/2';
                    else if (i === 2) stepPart = 'π';
                    else if (i === 3) stepPart = '3π/2';
                } else if (periodExpr === 'π/4') {
                    const fractions = ['', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4'];
                    stepPart = fractions[i] || `${i}π/4`;
                } else {
                    stepPart = `${i} · ${periodExpr}`;
                }
                symLabel = fullBaseExpr !== '0' ? `${fullBaseExpr} + ${stepPart}` : stepPart;
            }

            const rad = (deg * Math.PI) / 180.0;
            points.push({
                k: i,
                degrees: deg,
                radians: rad,
                quadrant: quad,
                label: symLabel,
                x: Math.cos(rad),
                y: Math.sin(rad)
            });
        }

        const order = ['I', 'II', 'III', 'IV'];
        const sortedQuads = order.filter(q => quadrantsSet.has(q));
        let quadTitle = '';
        if (sortedQuads.length === 1) {
            quadTitle = `${sortedQuads[0]} четверть`;
        } else if (sortedQuads.length === 2) {
            quadTitle = `${sortedQuads[0]} и ${sortedQuads[1]} четверти`;
        } else if (sortedQuads.length === 4) {
            quadTitle = `I, II, III, IV четверти (все четверти)`;
        } else if (sortedQuads.length === 3) {
            quadTitle = sortedQuads.join(', ') + ' четверти';
        } else {
            quadTitle = 'на осях';
        }

        // Generate school-ready pedagogical explanation steps
        const steps = [];
        let stepNum = 1;

        // Step 1: Base angle analysis
        let s1Expl = '';
        if (alphaSign === -1 && !offsetExpr) {
            s1Expl = `Базовый угол: -α.\nПо определению, угол α считается произвольным острым углом первой четверти (0° < α < 90°).\nЗнак «минус» перед α означает поворот по часовой стрелке (в отрицательном направлении) от положительного направления оси OX.\nСледовательно, луч угла -α попадает в IV четверть.`;
        } else if (alphaSign === 1 && !offsetExpr) {
            s1Expl = `Базовый угол: α.\nУгол α — острый угол первой четверти (0° < α < 90°).\nОткладывается от положительного направления оси OX против часовой стрелки и находится в I четверти.`;
        } else if (offsetExpr) {
            s1Expl = `Базовое выражение: ${fullBaseExpr}.\nПри остром угле α ∈ (0°, 90°) выражение ${fullBaseExpr} попадает в ${points[0].quadrant} четверть.`;
        } else {
            s1Expl = `Базовый угол: 0° (совпадает с положительной полуосью OX).`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: '1. Анализ базового угла',
            summary: `Угол: ${fullBaseExpr}`,
            formula: `${fullBaseExpr} при 0° < α < 90°`,
            explanation: s1Expl
        });

        // Step 2: Period analysis
        let s2Expl = `Слагаемое с переменной: ${periodExpr}${paramVar} (${paramVar} ∈ ℤ).\n`;
        s2Expl += `• Период серии равен T = ${periodExpr} (${periodDeg}°).\n`;
        s2Expl += `• Переменная ${paramVar} принимает любые целые значения: ..., -2, -1, 0, 1, 2, ...\n`;
        if (periodDeg === 360) {
            s2Expl += `• Прибавление 2π${paramVar} (360° · ${paramVar}) означает полный оборот вокруг начала координат. После любого целого числа полных оборотов луч возвращается в ту же самую точку круга.`;
        } else {
            s2Expl += `• За один полный оборот (2π = 360°) умещается: 360° / ${periodDeg}° = ${numPoints} шагов.\n`;
            s2Expl += `• Следовательно, на тригонометрическом круге получается ровно ${numPoints} ${numPoints === 1 ? 'точка' : (numPoints < 5 ? 'точки' : 'точек')}.`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: '2. Анализ периода и шага',
            summary: `Период: ${periodExpr} (${periodDeg}°), точек: ${numPoints}`,
            formula: `T = ${periodExpr}, ${paramVar} ∈ ℤ`,
            explanation: s2Expl
        });

        // Step 3: Distinct values table
        let s3Expl = `Перебираем значения параметра ${paramVar} от 0 до ${numPoints - 1} для получения всех различных положений на круге:\n\n`;
        for (const pt of points) {
            s3Expl += `• При ${paramVar} = ${pt.k}: ${pt.label} (при α = ${alphaDeg}° ≈ ${pt.degrees}°) ➔ ${pt.quadrant} четверть\n`;
        }
        if (numPoints > 1) {
            s3Expl += `\nПри ${paramVar} = ${numPoints}: значение повторяет точку при ${paramVar} = 0 (круг замыкается).`;
        }

        steps.push({
            stepNumber: stepNum++,
            title: `3. Точки на круге (${numPoints})`,
            summary: `${numPoints} ${numPoints === 1 ? 'положение' : 'положения'} луча`,
            formula: null,
            explanation: s3Expl
        });

        // Step 4: Final Conclusion
        let s4Expl = `Итоговые четверти для серии ${trimmed}:\n`;
        s4Expl += `Все точки серии попадают в: ${quadTitle}.`;

        steps.push({
            stepNumber: stepNum++,
            title: '4. Итоговый ответ',
            summary: quadTitle,
            formula: `Ответ: ${quadTitle}`,
            explanation: s4Expl
        });

        // Plain text solution for copying
        let copyText = `Задание: Изобразите значения на тригонометрическом круге и укажите их четверть:\n`;
        copyText += `${trimmed}\n\n`;
        copyText += `Решение:\n`;
        copyText += `1. Базовый угол: ${fullBaseExpr}. Так как α — острый угол (0° < α < 90°), то базовое положение луча попадает в ${points[0].quadrant} четверть.\n`;
        copyText += `2. Период серии: T = ${periodExpr} (${periodDeg}°). Число различных точек на круге: 360° / ${periodDeg}° = ${numPoints}.\n`;
        copyText += `3. Положения лучей при ${paramVar} ∈ ℤ:\n`;
        for (const pt of points) {
            copyText += `   • ${paramVar} = ${pt.k}: ${pt.label} — ${pt.quadrant} четверть\n`;
        }
        copyText += `\nОтвет: ${quadTitle}.`;

        return {
            isValid: true,
            isSeries: true,
            rawInput: trimmed,
            paramVar,
            alphaDeg,
            alphaSign,
            offsetDeg,
            offsetExpr,
            periodExpr,
            periodDeg,
            numPoints,
            points,
            quadrants: sortedQuads,
            quadTitle,
            steps,
            fullSolutionText: copyText
        };
    }

    static emptySeriesResult() {
        return {
            isValid: false,
            isSeries: true,
            rawInput: '',
            paramVar: 'k',
            alphaDeg: 35,
            alphaSign: 1,
            offsetDeg: 0,
            offsetExpr: '',
            periodExpr: '2π',
            periodDeg: 360,
            numPoints: 1,
            points: [],
            quadrants: [],
            quadTitle: '—',
            steps: [],
            fullSolutionText: ''
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrigEngine;
}

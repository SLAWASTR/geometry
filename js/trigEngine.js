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
            trig: trigValues
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

    static generateSteps({ hasPi, num, den, radians, degrees, norm, turns, quadrant, nearestTicks, minDist, nearestSummary, trig }) {
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

        // STEP 5: Coordinates
        steps.push({
            stepNumber: stepNum++,
            title: 'Точные тригонометрические значения',
            summary: `sin = ${trig.sinExact}, cos = ${trig.cosExact}`,
            formula: 'x = cos(α), y = sin(α)',
            explanation: `Координаты точки на единичной окружности:\n• x = cos(${normStr}) = ${trig.cosExact}\n• y = sin(${normStr}) = ${trig.sinExact}\n• tg(${normStr}) = ${trig.tanExact}\n• ctg(${normStr}) = ${trig.cotExact}`
        });

        return steps;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrigEngine;
}

import Foundation

public struct TrigEngine {
    
    // Greatest Common Divisor
    public static func gcd(_ a: Int, _ b: Int) -> Int {
        var x = abs(a)
        var y = abs(b)
        while y != 0 {
            let temp = x % y
            x = y
            y = temp
        }
        return x
    }
    
    /// Parses an angle input string (e.g. "3π/4", "-16п/3", "13pi/6", "5", etc.)
    public static func calculate(from input: String) -> AngleResult {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return .empty
        }
        
        // 1. Normalize characters: replace Russian 'п'/'пи', Unicode 'π', lowercase, etc.
        let s = trimmed
            .replacingOccurrences(of: "−", with: "-")
            .replacingOccurrences(of: "ПИ", with: "π")
            .replacingOccurrences(of: "Пи", with: "π")
            .replacingOccurrences(of: "пи", with: "π")
            .replacingOccurrences(of: "П", with: "π")
            .replacingOccurrences(of: "п", with: "π")
            .replacingOccurrences(of: "PI", with: "π")
            .replacingOccurrences(of: "Pi", with: "π")
            .replacingOccurrences(of: "pi", with: "π")
            .replacingOccurrences(of: "PI", with: "π")
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: ",", with: ".")
        
        let hasPi = s.contains("π")
        
        // Check for fraction: contains "/"
        var numeratorExact: Int? = nil
        var denominatorExact: Int? = nil
        var isFraction = false
        var degrees: Double = 0
        var radians: Double = 0
        
        if s.contains("/") {
            let parts = s.split(separator: "/", omittingEmptySubsequences: false)
            if parts.count != 2 {
                return errorResult(input: input, message: "Неверный формат дроби. Используйте формат a/b или a*π/b")
            }
            
            let numStr = String(parts[0])
            let denStr = String(parts[1])
            
            if denStr.isEmpty {
                return errorResult(input: input, message: "Знаменатель дроби не указан")
            }
            
            // Parse denominator
            guard let denVal = Double(denStr), denVal != 0 else {
                if Double(denStr) == 0 {
                    return errorResult(input: input, message: "Деление на ноль невозможно!")
                }
                return errorResult(input: input, message: "Знаменатель должен быть числом: '\(denStr)'")
            }
            
            // Parse numerator
            let (numVal, numIsInt, numIntVal) = parseNumerator(numStr)
            guard let validNumVal = numVal else {
                return errorResult(input: input, message: "Не удалось распознать числитель: '\(numStr)'")
            }
            
            isFraction = true
            let denIsInt = floor(denVal) == denVal
            if numIsInt, denIsInt {
                numeratorExact = numIntVal
                denominatorExact = Int(denVal)
            }
            
            if hasPi {
                // angle in radians = validNumVal * π / denVal
                radians = (validNumVal * .pi) / denVal
                // angle in degrees = validNumVal * 180 / denVal
                degrees = (validNumVal * 180.0) / denVal
            } else {
                // pure radians fraction
                radians = validNumVal / denVal
                degrees = (radians * 180.0) / .pi
            }
        } else {
            // Not a fraction: e.g. "3π", "-2π", "π", "4.5π", "1.5"
            let (val, isInt, intVal) = parseNumerator(s)
            guard let validVal = val else {
                return errorResult(input: input, message: "Не удалось распознать число: '\(s)'")
            }
            
            if hasPi {
                radians = validVal * .pi
                degrees = validVal * 180.0
                if isInt {
                    numeratorExact = intVal
                    denominatorExact = 1
                    isFraction = true
                }
            } else {
                radians = validVal
                degrees = (radians * 180.0) / .pi
            }
        }
        
        return buildResult(
            rawInput: input,
            hasPi: hasPi,
            isFraction: isFraction,
            numeratorExact: numeratorExact,
            denominatorExact: denominatorExact,
            radians: radians,
            degrees: degrees
        )
    }
    
    /// Parses numerator string that might contain "π"
    private static func parseNumerator(_ raw: String) -> (value: Double?, isInt: Bool, intVal: Int?) {
        var str = raw
        if str.isEmpty { return (nil, false, nil) }
        
        var sign: Double = 1.0
        if str.hasPrefix("-") {
            sign = -1.0
            str.removeFirst()
        } else if str.hasPrefix("+") {
            str.removeFirst()
        }
        
        if str.isEmpty { return (nil, false, nil) }
        
        if str == "π" {
            return (sign * 1.0, true, Int(sign * 1))
        }
        
        if str.contains("π") {
            let cleaned = str.replacingOccurrences(of: "*π", with: "")
                             .replacingOccurrences(of: "π*", with: "")
                             .replacingOccurrences(of: "π", with: "")
            if cleaned.isEmpty {
                return (sign * 1.0, true, Int(sign * 1))
            }
            if let num = Double(cleaned) {
                let isInt = floor(num) == num
                return (sign * num, isInt, isInt ? Int(sign * num) : nil)
            }
            return (nil, false, nil)
        } else {
            if let num = Double(str) {
                let isInt = floor(num) == num
                return (sign * num, isInt, isInt ? Int(sign * num) : nil)
            }
            return (nil, false, nil)
        }
    }
    
    private static func errorResult(input: String, message: String) -> AngleResult {
        var res = AngleResult.empty
        res.rawInput = input
        res.isValid = false
        res.errorMessage = message
        return res
    }
    
    /// Constructs the complete mathematical analysis and step-by-step school solution
    private static func buildResult(
        rawInput: String,
        hasPi: Bool,
        isFraction: Bool,
        numeratorExact: Int?,
        denominatorExact: Int?,
        radians: Double,
        degrees: Double
    ) -> AngleResult {
        let isPositive = degrees >= 0
        
        // 1. Normalized degrees in [0, 360)
        // Mathematically: norm = degrees - 360 * floor(degrees / 360)
        var norm = degrees.truncatingRemainder(dividingBy: 360.0)
        if norm < 0 {
            norm += 360.0
        }
        // Handle floating point near 360 or 0
        if abs(norm - 360.0) < 1e-9 || abs(norm) < 1e-9 {
            norm = 0.0
        }
        
        // Full turns (revolutions)
        let turns: Int
        if degrees >= 0 {
            turns = Int(floor(degrees / 360.0))
        } else {
            // For negative degrees, e.g. -960° / 360° = -2.666 -> floor is -3 turns
            turns = Int(floor(degrees / 360.0))
        }
        
        // 2. Determine Quadrant / Axis
        let quadrant: QuadrantType
        let eps = 1e-5
        
        if abs(norm - 0.0) < eps || abs(norm - 360.0) < eps {
            quadrant = .onAxis(.positiveX)
        } else if abs(norm - 90.0) < eps {
            quadrant = .onAxis(.positiveY)
        } else if abs(norm - 180.0) < eps {
            quadrant = .onAxis(.negativeX)
        } else if abs(norm - 270.0) < eps {
            quadrant = .onAxis(.negativeY)
        } else if norm > 0 && norm < 90 {
            quadrant = .first
        } else if norm > 90 && norm < 180 {
            quadrant = .second
        } else if norm > 180 && norm < 270 {
            quadrant = .third
        } else {
            quadrant = .fourth
        }
        
        // 3. Nearest Tick Calculation among [90°, 180°, 270°, 360°]
        // Standard ticks specified by prompt: "90°, 180°, 270° или 360°"
        // Note: 0° is equivalent to 360° on the circle.
        let ticks: [Double] = [90, 180, 270, 360]
        
        var minDistance: Double = 360.0
        var tickDistances: [(tick: Int, dist: Double)] = []
        
        for t in ticks {
            // Angular distance between norm and tick t (mod 360)
            let diff = abs(norm - t)
            let circDist = min(diff, 360.0 - diff)
            tickDistances.append((Int(t), circDist))
            if circDist < minDistance {
                minDistance = circDist
            }
        }
        
        // Find all ticks that share this minimum distance
        let nearestTicks = tickDistances
            .filter { abs($0.dist - minDistance) < 1e-4 }
            .map { $0.tick }
            .sorted()
        
        let nearestSummary: String
        let formattedDist = formatDegree(minDistance)
        
        if minDistance < 1e-5 {
            nearestSummary = "Находится ровно на засечке \(nearestTicks.first ?? 360)°"
        } else if nearestTicks.count == 2 {
            let t1 = nearestTicks[0]
            let t2 = nearestTicks[1]
            nearestSummary = "одинаково близко к \(t1)° и \(t2)° (расстояние \(formattedDist))"
        } else if nearestTicks.count == 1 {
            let t = nearestTicks[0]
            nearestSummary = "ближе к \(t)° (расстояние \(formattedDist))"
        } else {
            nearestSummary = "расстояние до засечки \(formattedDist)"
        }
        
        // 4. Trigonometric Values
        let trigValues = TrigValuesHelper.computeValues(for: norm)
        
        // 5. Generate Educational Steps
        let steps = generateSteps(
            rawInput: rawInput,
            hasPi: hasPi,
            isFraction: isFraction,
            num: numeratorExact,
            den: denominatorExact,
            radians: radians,
            degrees: degrees,
            norm: norm,
            turns: turns,
            quadrant: quadrant,
            nearestTicks: nearestTicks,
            minDist: minDistance,
            nearestSummary: nearestSummary,
            trig: trigValues
        )
        
        return AngleResult(
            rawInput: rawInput,
            isValid: true,
            errorMessage: nil,
            isFraction: isFraction,
            numerator: numeratorExact,
            denominator: denominatorExact,
            hasPi: hasPi,
            radians: radians,
            degrees: degrees,
            normalizedDegrees: norm,
            turns: turns,
            isPositive: isPositive,
            quadrant: quadrant,
            nearestTickSummary: nearestSummary,
            nearestTicks: nearestTicks,
            distanceToNearestTick: minDistance,
            trigValues: trigValues,
            steps: steps
        )
    }
    
    // MARK: - Step-by-Step Educational Explanation Generator
    
    private static func generateSteps(
        rawInput: String,
        hasPi: Bool,
        isFraction: Bool,
        num: Int?,
        den: Int?,
        radians: Double,
        degrees: Double,
        norm: Double,
        turns: Int,
        quadrant: QuadrantType,
        nearestTicks: [Int],
        minDist: Double,
        nearestSummary: String,
        trig: ExactTrigValues
    ) -> [CalculationStep] {
        var steps: [CalculationStep] = []
        var stepNum = 1
        
        let degStr = formatDegree(degrees)
        let normStr = formatDegree(norm)
        
        // STEP 1: Conversion from Radians to Degrees
        let s1Title = "Перевод из радиан в градусы"
        let s1Formula = "α° = α(рад) · (180° / π)"
        var s1Explanation = ""
        
        if hasPi, let a = num, let b = den {
            let signStr = a < 0 ? "−" : ""
            let absA = abs(a)
            
            if b == 1 {
                s1Explanation = "Подставляем значение π = 180°:\n" +
                                "\(a)π = \(a) · 180° = \(degStr)."
            } else if 180 % b == 0 {
                let div = 180 / b
                s1Explanation = "Подставляем π = 180° и сокращаем знаменатель:\n" +
                                "\(signStr)(\(absA) · 180°) / \(b) = \(signStr)\(absA) · (180° / \(b)) = \(signStr)\(absA) · \(div)° = \(degStr)."
            } else {
                let totalNum = absA * 180
                s1Explanation = "Подставляем π = 180°:\n" +
                                "\(signStr)(\(absA) · 180°) / \(b) = \(signStr)\(totalNum)° / \(b) = \(degStr)."
            }
        } else if hasPi {
            let mult = degrees / 180.0
            s1Explanation = "Подставляем π = 180°:\n" +
                            "\(String(format: "%.3f", mult)) · 180° = \(degStr)."
        } else {
            s1Explanation = "Умножаем значение угла в радианах на коэффициент (180° / π):\n" +
                            "\(String(format: "%.4f", radians)) · (180° / 3.14159...) = \(degStr)."
        }
        
        steps.append(CalculationStep(
            stepNumber: stepNum,
            title: s1Title,
            iconName: "function",
            summary: "Полученный угол: \(degStr)",
            formula: s1Formula,
            explanation: s1Explanation
        ))
        stepNum += 1
        
        // STEP 2: Direction of rotation and normalization to [0°, 360°)
        let s2Title = "Направление вращения и полные обороты"
        var s2Formula: String? = nil
        var s2Explanation = ""
        
        if degrees >= 0 && degrees < 360 {
            s2Explanation = "Угол положительный (\(degStr) ≥ 0°), поэтому луч откладывается от положительной полуоси Ox против часовой стрелки.\n" +
                            "Угол уже находится в базовом диапазоне от 0° до 360° (0 полных оборотов)."
        } else if degrees >= 360 {
            let k = turns
            let kRev = k == 1 ? "1 полный оборот" : "\(k) полных оборота(ов)"
            s2Formula = "α₀ = α − 360° · k"
            s2Explanation = "Угол \(degStr) превышает полный круг (360°).\n" +
                            "Луч совершает \(kRev) против часовой стрелки:\n" +
                            "\(degStr) − \(k) · 360° = \(degStr) − \(k * 360)° = \(normStr).\n" +
                            "Конечное положение луча соответствует углу \(normStr)."
        } else {
            // Negative angle
            let k = abs(turns)
            let kRev = k == 1 ? "1 оборот" : "\(k) оборота(ов)"
            s2Formula = "α₀ = α + 360° · k"
            s2Explanation = "Угол отрицательный (\(degStr) < 0°), поэтому отсчёт ведётся по часовой стрелке.\n" +
                            "Чтобы найти конечное положение луча на круге, прибавим полные обороты (\(kRev)):\n" +
                            "\(degStr) + \(k) · 360° = \(degStr) + \(k * 360)° = \(normStr).\n" +
                            "Приведенный угол на круге: \(normStr)."
        }
        
        steps.append(CalculationStep(
            stepNumber: stepNum,
            title: s2Title,
            iconName: degrees < 0 ? "arrow.clockwise" : "arrow.counterclockwise",
            summary: degrees >= 0 && degrees < 360 ? "Стандартный диапазон [0°, 360°)" : "После приведения: \(normStr)",
            formula: s2Formula,
            explanation: s2Explanation
        ))
        stepNum += 1
        
        // STEP 3: Quadrant determination
        let s3Title = "Определение четверти"
        var s3Summary = ""
        var s3Explanation = ""
        
        switch quadrant {
        case .first:
            s3Summary = "I четверть"
            s3Explanation = "Сравниваем угол с границами четвертей: 0° < \(normStr) < 90°.\n" +
                            "Угол находится в первой (I) четверти координатной плоскости (правая верхняя область)."
        case .second:
            s3Summary = "II четверть"
            s3Explanation = "Сравниваем угол с границами четвертей: 90° < \(normStr) < 180°.\n" +
                            "Угол находится во второй (II) четверти координатной плоскости (левая верхняя область)."
        case .third:
            s3Summary = "III четверть"
            s3Explanation = "Сравниваем угол с границами четвертей: 180° < \(normStr) < 270°.\n" +
                            "Угол находится в третьей (III) четверти координатной плоскости (левая нижняя область)."
        case .fourth:
            s3Summary = "IV четверть"
            s3Explanation = "Сравниваем угол с границами четвертей: 270° < \(normStr) < 360°.\n" +
                            "Угол находится в четвёртой (IV) четверти координатной плоскости (правая нижняя область)."
        case .onAxis(let axis):
            s3Summary = "Лежит на оси (\(axis.shortTitle))"
            s3Explanation = "Угол равен \(normStr), поэтому луч совпадает с осью координат (\(axis.rawValue)).\n" +
                            "Внимание: если конечная сторона лежит непосредственно на оси, угол НЕ относится ни к какой четверти!"
        }
        
        steps.append(CalculationStep(
            stepNumber: stepNum,
            title: s3Title,
            iconName: "square.grid.2x2",
            summary: s3Summary,
            formula: "I: (0°, 90°) | II: (90°, 180°) | III: (180°, 270°) | IV: (270°, 360°)",
            explanation: s3Explanation
        ))
        stepNum += 1
        
        // STEP 4: Nearest Tick Mark
        let s4Title = "Ближайшая засечка на круге"
        var s4Explanation = "Проверяем расстояния от приведенного угла \(normStr) до ключевых засечек 90°, 180°, 270° и 360° (0°):\n"
        
        let d90 = min(abs(norm - 90), 360 - abs(norm - 90))
        let d180 = abs(norm - 180)
        let d270 = min(abs(norm - 270), 360 - abs(norm - 270))
        let d360 = min(norm, 360 - norm)
        
        s4Explanation += "• До 90°: \(formatDegree(d90))\n"
        s4Explanation += "• До 180°: \(formatDegree(d180))\n"
        s4Explanation += "• До 270°: \(formatDegree(d270))\n"
        s4Explanation += "• До 360°: \(formatDegree(d360))\n\n"
        
        if nearestTicks.count == 2 {
            s4Explanation += "Минимальное расстояние \(formatDegree(minDist)) достигается одновременно для засечек \(nearestTicks[0])° и \(nearestTicks[1])° (угол делит четверть ровно пополам)."
        } else if nearestTicks.count == 1 {
            s4Explanation += "Минимальное расстояние равно \(formatDegree(minDist)) до засечки \(nearestTicks[0])°."
        }
        
        steps.append(CalculationStep(
            stepNumber: stepNum,
            title: s4Title,
            iconName: "target",
            summary: nearestSummary,
            formula: nil,
            explanation: s4Explanation
        ))
        stepNum += 1
        
        // STEP 5: Trigonometric Coordinates
        let s5Summary = "sin = \(trig.sinExact), cos = \(trig.cosExact)"
        let s5Explanation = "Координаты точки P(x, y) на единичной окружности:\n" +
                            "• x = cos(\(normStr)) = \(trig.cosExact)\n" +
                            "• y = sin(\(normStr)) = \(trig.sinExact)\n" +
                            "• tg(\(normStr)) = \(trig.tanExact)\n" +
                            "• ctg(\(normStr)) = \(trig.cotExact)"
        
        steps.append(CalculationStep(
            stepNumber: stepNum,
            title: "Точные тригонометрические значения",
            iconName: "circle.circle",
            summary: s5Summary,
            formula: "x = cos(α), y = sin(α)",
            explanation: s5Explanation
        ))
        
        return steps
    }
    
    public static func formatDegree(_ val: Double) -> String {
        let rounded = round(val * 100) / 100
        if floor(rounded) == rounded {
            return "\(Int(rounded))°"
        } else {
            return String(format: "%.1f°", rounded)
        }
    }
}

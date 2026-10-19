import Foundation

public enum QuadrantType: Equatable {
    case first
    case second
    case third
    case fourth
    case onAxis(AxisType)
    
    public var title: String {
        switch self {
        case .first: return "I четверть"
        case .second: return "II четверть"
        case .third: return "III четверть"
        case .fourth: return "IV четверть"
        case .onAxis(let axis): return "На оси (\(axis.shortTitle))"
        }
    }
    
    public var shortName: String {
        switch self {
        case .first: return "I"
        case .second: return "II"
        case .third: return "III"
        case .fourth: return "IV"
        case .onAxis(let axis): return axis.shortTitle
        }
    }
    
    public var isAxis: Bool {
        if case .onAxis = self { return true }
        return false
    }
}

public enum AxisType: String, Equatable {
    case positiveX = "Положительная полуось Ox (0° / 360°)"
    case positiveY = "Положительная полуось Oy (90°)"
    case negativeX = "Отрицательная полуось Ox (180°)"
    case negativeY = "Отрицательная полуось Oy (270°)"
    
    public var shortTitle: String {
        switch self {
        case .positiveX: return "+Ox"
        case .positiveY: return "+Oy"
        case .negativeX: return "-Ox"
        case .negativeY: return "-Oy"
        }
    }
}

public struct CalculationStep: Identifiable, Equatable {
    public let id = UUID()
    public let stepNumber: Int
    public let title: String
    public let iconName: String
    public let summary: String
    public let formula: String?
    public let explanation: String
}

public struct ExactTrigValues: Equatable {
    public let sinExact: String
    public let cosExact: String
    public let tanExact: String
    public let cotExact: String
    
    public let sinApprox: Double
    public let cosApprox: Double
    public let tanApprox: Double?
    public let cotApprox: Double?
}

public struct AngleResult: Equatable {
    public var rawInput: String
    public var isValid: Bool
    public var errorMessage: String?
    
    // Exact Fraction representation if available
    public var isFraction: Bool
    public var numerator: Int?
    public var denominator: Int?
    public var hasPi: Bool
    
    // Values
    public var radians: Double
    public var degrees: Double
    public var normalizedDegrees: Double // in [0, 360)
    
    // Revolutions
    public var turns: Int // 0 if in [0, 360)
    public var isPositive: Bool
    
    // Position
    public var quadrant: QuadrantType
    public var nearestTickSummary: String
    public var nearestTicks: [Int] // [90], [180], [90, 180], etc.
    public var distanceToNearestTick: Double
    
    // Trigonometric functions
    public var trigValues: ExactTrigValues
    
    // Educational steps
    public var steps: [CalculationStep]
    
    public static var empty: AngleResult {
        AngleResult(
            rawInput: "",
            isValid: false,
            errorMessage: "Введите угол в радианах",
            isFraction: false,
            numerator: nil,
            denominator: nil,
            hasPi: false,
            radians: 0,
            degrees: 0,
            normalizedDegrees: 0,
            turns: 0,
            isPositive: true,
            quadrant: .onAxis(.positiveX),
            nearestTickSummary: "",
            nearestTicks: [360],
            distanceToNearestTick: 0,
            trigValues: ExactTrigValues(sinExact: "0", cosExact: "1", tanExact: "0", cotExact: "не сущ.", sinApprox: 0, cosApprox: 1, tanApprox: 0, cotApprox: nil),
            steps: []
        )
    }
}

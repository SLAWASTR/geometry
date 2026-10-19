import SwiftUI
import AppKit

public enum InputMode: String, CaseIterable, Identifiable {
    case inline = "Строка (через /)"
    case fraction = "Дробь (как в учебнике)"
    
    public var id: String { rawValue }
}

public struct ExampleAngle: Identifiable {
    public let id = UUID()
    public let label: String
    public let value: String
    public let note: String
}

@MainActor
public class TrigViewModel: ObservableObject {
    @Published public var inputMode: InputMode = .inline
    @Published public var rawInputText: String = "3π/4"
    @Published public var fracNumerator: String = "3π"
    @Published public var fracDenominator: String = "4"
    @Published public var fracNegative: Bool = false
    
    @Published public var angleResult: AngleResult = .empty
    @Published public var sliderDegrees: Double = 135.0
    @Published public var copiedToClipboard: Bool = false
    
    public let examples: [ExampleAngle] = [
        ExampleAngle(label: "3π/4", value: "3π/4", note: "135°, II четв."),
        ExampleAngle(label: "13π/6", value: "13π/6", note: "390°, I четв."),
        ExampleAngle(label: "5π/3", value: "5π/3", note: "300°, IV четв."),
        ExampleAngle(label: "17π/6", value: "17π/6", note: "510°, II четв."),
        ExampleAngle(label: "-7π/4", value: "-7π/4", note: "−315°, I четв."),
        ExampleAngle(label: "-π/6", value: "-π/6", note: "−30°, IV четв."),
        ExampleAngle(label: "-11π/6", value: "-11π/6", note: "−330°, I четв."),
        ExampleAngle(label: "-16π/3", value: "-16π/3", note: "−960°, II четв."),
        ExampleAngle(label: "π", value: "π", note: "180°, на оси"),
        ExampleAngle(label: "3π/2", value: "3π/2", note: "270°, на оси")
    ]
    
    public init() {
        commit()
    }
    
    public func commit() {
        if inputMode == .inline {
            angleResult = TrigEngine.calculate(from: rawInputText)
            syncFractionFieldsFromRaw()
        } else {
            let sign = fracNegative ? "-" : ""
            let num = fracNumerator.trimmingCharacters(in: .whitespaces)
            let den = fracDenominator.trimmingCharacters(in: .whitespaces)
            let expr = "\(sign)\(num)/\(den)"
            rawInputText = expr
            angleResult = TrigEngine.calculate(from: expr)
        }
        if angleResult.isValid {
            sliderDegrees = angleResult.degrees
        }
    }
    
    public func selectExample(_ val: String) {
        rawInputText = val
        syncFractionFieldsFromRaw()
        angleResult = TrigEngine.calculate(from: val)
        if angleResult.isValid {
            sliderDegrees = angleResult.degrees
        }
    }
    
    public func clear() {
        rawInputText = ""
        fracNumerator = ""
        fracDenominator = "1"
        fracNegative = false
        angleResult = .empty
    }
    
    public func selectFromCircle(deg: Double) {
        // Snap to nearest 5 or 15 degrees if close
        let snapCandidate = round(deg / 15.0) * 15.0
        let effectiveDeg = abs(deg - snapCandidate) < 3.0 ? snapCandidate : round(deg)
        
        sliderDegrees = effectiveDeg
        updateFromDegrees(effectiveDeg)
    }
    
    public func sliderChanged(deg: Double) {
        updateFromDegrees(deg)
    }
    
    private func updateFromDegrees(_ deg: Double) {
        let degInt = Int(round(deg))
        let sign = degInt < 0 ? "-" : ""
        let absDeg = abs(degInt)
        
        // k / m = absDeg / 180
        let g = TrigEngine.gcd(absDeg, 180)
        let k = absDeg / g
        let m = 180 / g
        
        let expr: String
        if m == 1 {
            if k == 0 {
                expr = "0"
            } else if k == 1 {
                expr = "\(sign)π"
            } else {
                expr = "\(sign)\(k)π"
            }
        } else {
            let numStr = k == 1 ? "π" : "\(k)π"
            expr = "\(sign)\(numStr)/\(m)"
        }
        
        rawInputText = expr
        syncFractionFieldsFromRaw()
        angleResult = TrigEngine.calculate(from: expr)
    }
    
    private func syncFractionFieldsFromRaw() {
        var s = rawInputText.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("-") || s.hasPrefix("−") {
            fracNegative = true
            s.removeFirst()
        } else {
            fracNegative = false
        }
        
        if s.contains("/") {
            let parts = s.split(separator: "/")
            if parts.count >= 1 { fracNumerator = String(parts[0]) }
            if parts.count >= 2 { fracDenominator = String(parts[1]) }
        } else {
            fracNumerator = s
            fracDenominator = "1"
        }
    }
    
    public func copySolutionText() {
        guard angleResult.isValid else { return }
        
        var text = "Решение задачи по тригонометрии:\n"
        text += "Автор: @slawastr 1-26 design\n"
        text += "Исходный угол: \(angleResult.rawInput)\n"
        text += "В градусах: \(TrigEngine.formatDegree(angleResult.degrees))\n"
        text += "Угол на круге [0°, 360°): \(TrigEngine.formatDegree(angleResult.normalizedDegrees))\n"
        text += "Положение: \(angleResult.quadrant.title)\n"
        text += "Ближайшая засечка: \(angleResult.nearestTickSummary)\n\n"
        text += "Шаги решения:\n"
        for s in angleResult.steps {
            text += "\nШаг \(s.stepNumber). \(s.title)\n"
            if let f = s.formula {
                text += "Формула: \(f)\n"
            }
            text += "\(s.explanation)\n"
        }
        text += "\nРазработано: @slawastr 1-26 design"
        
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        
        withAnimation {
            copiedToClipboard = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            withAnimation {
                self?.copiedToClipboard = false
            }
        }
    }
}

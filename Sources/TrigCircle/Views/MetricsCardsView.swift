import SwiftUI

public struct MetricsCardsView: View {
    public let result: AngleResult
    @Environment(\.colorScheme) private var colorScheme
    
    public init(result: AngleResult) {
        self.result = result
    }
    
    public var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            // Card 1: Исходный угол и полученные градусы
            metricCard(
                title: "Исходный угол",
                icon: "ruler",
                accentColor: .blue,
                primaryValue: result.isValid ? TrigEngine.formatDegree(result.degrees) : "—",
                subValue: result.isValid ? "\(formatRadianText(result))" : "нет данных"
            )
            
            // Card 2: Приведенный угол [0°, 360°)
            metricCard(
                title: "Угол на круге [0°, 360°)",
                icon: result.turns != 0 ? "arrow.triangle.2.circlepath" : "checkmark.circle",
                accentColor: .purple,
                primaryValue: result.isValid ? TrigEngine.formatDegree(result.normalizedDegrees) : "—",
                subValue: result.isValid ? formatRevolutions(result) : "нет данных"
            )
            
            // Card 3: Четверть или ось
            metricCard(
                title: "Положение на плоскости",
                icon: "square.grid.2x2",
                accentColor: result.quadrant.isAxis ? .orange : .green,
                primaryValue: result.isValid ? result.quadrant.title : "—",
                subValue: result.isValid ? formatQuadrantBounds(result.quadrant) : "нет данных"
            )
            
            // Card 4: Ближайшая засечка
            metricCard(
                title: "Ближайшая засечка",
                icon: "scope",
                accentColor: .orange,
                primaryValue: result.isValid ? formatNearestHeader(result) : "—",
                subValue: result.isValid ? "Расстояние: \(TrigEngine.formatDegree(result.distanceToNearestTick))" : "нет данных"
            )
        }
    }
    
    private func metricCard(title: String, icon: String, accentColor: Color, primaryValue: String, subValue: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(accentColor)
                Text(title)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            
            Text(primaryValue)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            
            Text(subValue)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.secondary)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(colorScheme == .dark ? Color(white: 0.14) : Color(white: 0.96))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(accentColor.opacity(0.2), lineWidth: 1)
        )
    }
    
    private func formatRadianText(_ res: AngleResult) -> String {
        if res.isFraction, let a = res.numerator, let b = res.denominator {
            if b == 1 {
                return "\(a)π рад"
            } else {
                return "\(a)π/\(b) рад ≈ \(String(format: "%.3f", res.radians)) рад"
            }
        } else {
            return "\(String(format: "%.3f", res.radians)) рад"
        }
    }
    
    private func formatRevolutions(_ res: AngleResult) -> String {
        if res.degrees >= 0 && res.degrees < 360 {
            return "В пределах 1-го оборота (0 полных)"
        } else if res.degrees >= 360 {
            let k = res.turns
            return "Отброшено \(k) об. против час. стрелки"
        } else {
            let k = abs(res.turns)
            return "Прибавлено \(k) об. (по час. стрелке)"
        }
    }
    
    private func formatQuadrantBounds(_ q: QuadrantType) -> String {
        switch q {
        case .first: return "Между 0° и 90°"
        case .second: return "Между 90° и 180°"
        case .third: return "Между 180° и 270°"
        case .fourth: return "Между 270° и 360°"
        case .onAxis(let axis): return axis.rawValue
        }
    }
    
    private func formatNearestHeader(_ res: AngleResult) -> String {
        if res.distanceToNearestTick < 1e-4 {
            return "\(res.nearestTicks.first ?? 360)° (ровно на оси)"
        } else if res.nearestTicks.count == 2 {
            return "\(res.nearestTicks[0])° и \(res.nearestTicks[1])°"
        } else if res.nearestTicks.count == 1 {
            return "\(res.nearestTicks[0])°"
        } else {
            return res.nearestTickSummary
        }
    }
}

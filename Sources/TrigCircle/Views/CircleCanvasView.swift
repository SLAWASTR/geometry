import SwiftUI

public struct CircleCanvasView: View {
    public let result: AngleResult
    public var onSelectAngle: ((Double) -> Void)? = nil
    
    @Environment(\.colorScheme) private var colorScheme
    
    public init(result: AngleResult, onSelectAngle: ((Double) -> Void)? = nil) {
        self.result = result
        self.onSelectAngle = onSelectAngle
    }
    
    public var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
            let radius = size * 0.36
            
            ZStack {
                // Background subtle circular card
                Circle()
                    .fill(colorScheme == .dark ? Color(white: 0.12) : Color.white)
                    .frame(width: radius * 2.3, height: radius * 2.3)
                    .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.4 : 0.08), radius: 12, x: 0, y: 4)
                
                Canvas { context, canvasSize in
                    drawCanvas(context: context, size: canvasSize, center: center, radius: radius)
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            let loc = value.location
                            let dx = loc.x - center.x
                            let dy = -(loc.y - center.y) // Invert Y for Cartesian
                            var rad = atan2(dy, dx)
                            if rad < 0 { rad += 2 * .pi }
                            let deg = rad * 180.0 / .pi
                            onSelectAngle?(deg)
                        }
                )
                
                // Overlay Badges for Quadrants
                quadrantOverlayBadges(center: center, radius: radius)
                
                // Axis Ticks Labels (90°, 180°, 270°, 360° / 0°)
                axisLabelsOverlay(center: center, radius: radius)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1.0, contentMode: .fit)
    }
    
    // MARK: - Drawing Routine
    
    private func drawCanvas(context: GraphicsContext, size: CGSize, center: CGPoint, radius: CGFloat) {
        // 1. Highlight Quadrant
        drawQuadrantHighlight(context: context, center: center, radius: radius)
        
        // 2. Draw Main Circle
        let circlePath = Path { p in
            p.addEllipse(in: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2))
        }
        context.stroke(
            circlePath,
            with: .color(colorScheme == .dark ? Color(white: 0.35) : Color(white: 0.75)),
            lineWidth: 2
        )
        
        // 3. Draw Subdivisions (30°, 45°, 60°, etc.)
        drawSubdivisionTicks(context: context, center: center, radius: radius)
        
        // 4. Draw Coordinate Axes (Ox, Oy) with Arrows
        drawCoordinateAxes(context: context, center: center, radius: radius, size: size)
        
        // If result is invalid, stop here
        guard result.isValid else { return }
        
        // 5. Draw Rotation Arc / Spiral
        drawRotationArcOrSpiral(context: context, center: center, radius: radius)
        
        // 6. Draw Terminal Ray & Endpoint
        drawTerminalRay(context: context, center: center, radius: radius)
        
        // 7. Draw Projections to Axes (cos, sin)
        drawProjections(context: context, center: center, radius: radius)
    }
    
    // MARK: - Quadrant Shading
    
    private func drawQuadrantHighlight(context: GraphicsContext, center: CGPoint, radius: CGFloat) {
        guard result.isValid else { return }
        
        var startAngle: Double? = nil
        var endAngle: Double? = nil
        
        switch result.quadrant {
        case .first:
            startAngle = 0
            endAngle = 90
        case .second:
            startAngle = 90
            endAngle = 180
        case .third:
            startAngle = 180
            endAngle = 270
        case .fourth:
            startAngle = 270
            endAngle = 360
        case .onAxis:
            break
        }
        
        if let s = startAngle, let e = endAngle {
            var sectorPath = Path()
            sectorPath.move(to: center)
            // Note: In Canvas/CoreGraphics, 0° is +X, angle increases clockwise in standard screen coordinates!
            // But mathematical Cartesian angles increase counter-clockwise!
            // So mathematical angle theta corresponds to screen angle -theta!
            sectorPath.addArc(
                center: center,
                radius: radius,
                startAngle: .degrees(-s),
                endAngle: .degrees(-e),
                clockwise: true
            )
            sectorPath.closeSubpath()
            
            let highlightColor = Color.blue.opacity(colorScheme == .dark ? 0.22 : 0.12)
            context.fill(sectorPath, with: .color(highlightColor))
        }
    }
    
    // MARK: - Subdivisions
    
    private func drawSubdivisionTicks(context: GraphicsContext, center: CGPoint, radius: CGFloat) {
        let specialAngles: [Double] = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]
        
        for deg in specialAngles {
            let rad = deg * .pi / 180.0
            let is45 = (Int(deg) % 90 == 45)
            let tickLen: CGFloat = is45 ? 8 : 6
            
            let xOuter = center.x + radius * cos(rad)
            let yOuter = center.y - radius * sin(rad)
            
            let xInner = center.x + (radius - tickLen) * cos(rad)
            let yInner = center.y - (radius - tickLen) * sin(rad)
            
            var p = Path()
            p.move(to: CGPoint(x: xInner, y: yInner))
            p.addLine(to: CGPoint(x: xOuter, y: yOuter))
            
            let tickColor = is45 ? Color.orange.opacity(0.6) : Color.gray.opacity(0.4)
            context.stroke(p, with: .color(tickColor), lineWidth: 1.5)
        }
    }
    
    // MARK: - Coordinate Axes
    
    private func drawCoordinateAxes(context: GraphicsContext, center: CGPoint, radius: CGFloat, size: CGSize) {
        let axisColor = colorScheme == .dark ? Color(white: 0.75) : Color(white: 0.3)
        let axisLength = radius * 1.25
        let arrowSize: CGFloat = 8
        
        // Horizontal Axis (X / cos)
        var xPath = Path()
        xPath.move(to: CGPoint(x: center.x - axisLength, y: center.y))
        xPath.addLine(to: CGPoint(x: center.x + axisLength, y: center.y))
        context.stroke(xPath, with: .color(axisColor), lineWidth: 1.5)
        
        // Arrow for X
        var xArrow = Path()
        xArrow.move(to: CGPoint(x: center.x + axisLength, y: center.y))
        xArrow.addLine(to: CGPoint(x: center.x + axisLength - arrowSize, y: center.y - arrowSize * 0.5))
        xArrow.addLine(to: CGPoint(x: center.x + axisLength - arrowSize, y: center.y + arrowSize * 0.5))
        xArrow.closeSubpath()
        context.fill(xArrow, with: .color(axisColor))
        
        // Vertical Axis (Y / sin)
        var yPath = Path()
        yPath.move(to: CGPoint(x: center.x, y: center.y + axisLength))
        yPath.addLine(to: CGPoint(x: center.x, y: center.y - axisLength))
        context.stroke(yPath, with: .color(axisColor), lineWidth: 1.5)
        
        // Arrow for Y
        var yArrow = Path()
        yArrow.move(to: CGPoint(x: center.x, y: center.y - axisLength))
        yArrow.addLine(to: CGPoint(x: center.x - arrowSize * 0.5, y: center.y - axisLength + arrowSize))
        yArrow.addLine(to: CGPoint(x: center.x + arrowSize * 0.5, y: center.y - axisLength + arrowSize))
        yArrow.closeSubpath()
        context.fill(yArrow, with: .color(axisColor))
        
        // Center Dot O(0,0)
        let centerDot = Path(ellipseIn: CGRect(x: center.x - 3, y: center.y - 3, width: 6, height: 6))
        context.fill(centerDot, with: .color(axisColor))
        
        // Main Ticks at 4 corners
        let mainTickLen: CGFloat = 10
        // (1, 0)
        var t0 = Path()
        t0.move(to: CGPoint(x: center.x + radius, y: center.y - mainTickLen/2))
        t0.addLine(to: CGPoint(x: center.x + radius, y: center.y + mainTickLen/2))
        context.stroke(t0, with: .color(.primary), lineWidth: 2)
        
        // (0, 1) - top
        var t90 = Path()
        t90.move(to: CGPoint(x: center.x - mainTickLen/2, y: center.y - radius))
        t90.addLine(to: CGPoint(x: center.x + mainTickLen/2, y: center.y - radius))
        context.stroke(t90, with: .color(.primary), lineWidth: 2)
        
        // (-1, 0)
        var t180 = Path()
        t180.move(to: CGPoint(x: center.x - radius, y: center.y - mainTickLen/2))
        t180.addLine(to: CGPoint(x: center.x - radius, y: center.y + mainTickLen/2))
        context.stroke(t180, with: .color(.primary), lineWidth: 2)
        
        // (0, -1) - bottom
        var t270 = Path()
        t270.move(to: CGPoint(x: center.x - mainTickLen/2, y: center.y + radius))
        t270.addLine(to: CGPoint(x: center.x + mainTickLen/2, y: center.y + radius))
        context.stroke(t270, with: .color(.primary), lineWidth: 2)
        
        // Axis Labels (X / cos, Y / sin)
        context.draw(
            Text("X (cos)").font(.system(size: 11, weight: .bold)).foregroundColor(axisColor),
            at: CGPoint(x: center.x + axisLength + 18, y: center.y + 14)
        )
        context.draw(
            Text("Y (sin)").font(.system(size: 11, weight: .bold)).foregroundColor(axisColor),
            at: CGPoint(x: center.x - 18, y: center.y - axisLength - 10)
        )
        context.draw(
            Text("O").font(.system(size: 10, weight: .medium)).foregroundColor(.secondary),
            at: CGPoint(x: center.x - 10, y: center.y + 10)
        )
    }
    
    // MARK: - Terminal Ray
    
    private func drawTerminalRay(context: GraphicsContext, center: CGPoint, radius: CGFloat) {
        let normRad = result.normalizedDegrees * .pi / 180.0
        let targetX = center.x + radius * cos(normRad)
        let targetY = center.y - radius * sin(normRad)
        
        // Line from center to circle
        var rayPath = Path()
        rayPath.move(to: center)
        rayPath.addLine(to: CGPoint(x: targetX, y: targetY))
        
        let rayColor = Color.orange
        context.stroke(rayPath, with: .color(rayColor), style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
        
        // Glowing dot at the end point
        let dotRadius: CGFloat = 7
        let dotRect = CGRect(x: targetX - dotRadius, y: targetY - dotRadius, width: dotRadius * 2, height: dotRadius * 2)
        context.fill(Path(ellipseIn: dotRect), with: .color(rayColor))
        
        // Outer halo
        let haloRect = CGRect(x: targetX - dotRadius * 1.6, y: targetY - dotRadius * 1.6, width: dotRadius * 3.2, height: dotRadius * 3.2)
        context.stroke(Path(ellipseIn: haloRect), with: .color(rayColor.opacity(0.4)), lineWidth: 2)
    }
    
    // MARK: - Projections to Axes
    
    private func drawProjections(context: GraphicsContext, center: CGPoint, radius: CGFloat) {
        let normRad = result.normalizedDegrees * .pi / 180.0
        let targetX = center.x + radius * cos(normRad)
        let targetY = center.y - radius * sin(normRad)
        
        // Drop dashed lines to Ox and Oy
        var projXPath = Path()
        projXPath.move(to: CGPoint(x: targetX, y: targetY))
        projXPath.addLine(to: CGPoint(x: targetX, y: center.y))
        context.stroke(
            projXPath,
            with: .color(Color.indigo.opacity(0.6)),
            style: StrokeStyle(lineWidth: 1.5, dash: [4, 4])
        )
        
        var projYPath = Path()
        projYPath.move(to: CGPoint(x: targetX, y: targetY))
        projYPath.addLine(to: CGPoint(x: center.x, y: targetY))
        context.stroke(
            projYPath,
            with: .color(Color.teal.opacity(0.6)),
            style: StrokeStyle(lineWidth: 1.5, dash: [4, 4])
        )
    }
    
    // MARK: - Rotation Arc / Archimedean Spiral
    
    private func drawRotationArcOrSpiral(context: GraphicsContext, center: CGPoint, radius: CGFloat) {
        let totalDegrees = result.degrees
        guard abs(totalDegrees) > 0.5 else { return }
        
        let isPositive = totalDegrees >= 0
        let arcBaseRadius = radius * 0.42
        
        // If angle is within standard single circle: [-360°, 360°]
        if abs(totalDegrees) <= 360 {
            var arcPath = Path()
            // In screen coordinates: math angle theta is screen angle -theta
            arcPath.addArc(
                center: center,
                radius: arcBaseRadius,
                startAngle: .degrees(0),
                endAngle: .degrees(-totalDegrees),
                clockwise: !isPositive
            )
            
            let arcColor = isPositive ? Color.blue : Color.red
            context.stroke(
                arcPath,
                with: .color(arcColor),
                style: StrokeStyle(lineWidth: 2.2, lineCap: .round)
            )
            
            // Draw arrow at the end of the arc
            drawArcArrow(context: context, center: center, r: arcBaseRadius, degree: totalDegrees, isPositive: isPositive, color: arcColor)
        } else {
            // Spiral for multiple revolutions! (Archimedean spiral)
            var spiralPath = Path()
            let totalRad = abs(totalDegrees) * .pi / 180.0
            let totalTurns = totalRad / (2 * .pi)
            
            // For large angles (up to 5000° ≈ 14 turns), we visualize smooth spiral
            let minR = radius * 0.18
            let maxR = radius * 0.58
            
            // Draw visually legible spiral
            let visualTurns = min(totalTurns, 5.0)
            let visualDegrees = visualTurns * 360.0
            let steps = Int(visualDegrees / 3.0) + 1
            
            for i in 0...steps {
                let currentDeg = Double(i) * 3.0 * (isPositive ? 1.0 : -1.0)
                let t = Double(i) / Double(steps)
                let currentRad = currentDeg * .pi / 180.0
                let currentR = minR + CGFloat(t) * (maxR - minR)
                
                let x = center.x + currentR * cos(currentRad)
                let y = center.y - currentR * sin(currentRad)
                
                if i == 0 {
                    spiralPath.move(to: CGPoint(x: x, y: y))
                } else {
                    spiralPath.addLine(to: CGPoint(x: x, y: y))
                }
            }
            
            let spiralColor = isPositive ? Color.blue : Color.red
            context.stroke(
                spiralPath,
                with: .color(spiralColor.opacity(0.85)),
                style: StrokeStyle(lineWidth: 2.2, lineCap: .round)
            )
            
            // Draw arrow at the tip of the spiral pointing along actual angle
            drawArcArrow(context: context, center: center, r: maxR, degree: totalDegrees, isPositive: isPositive, color: spiralColor)
            
            // Draw revolution count text near center
            let revText = String(format: "%@%.1f об.", isPositive ? "+" : "−", abs(totalDegrees / 360.0))
            context.draw(
                Text(revText)
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundColor(spiralColor),
                at: CGPoint(x: center.x, y: center.y + radius * 0.26)
            )
        }
    }
    
    private func drawArcArrow(context: GraphicsContext, center: CGPoint, r: CGFloat, degree: Double, isPositive: Bool, color: Color) {
        let mathRad = degree * .pi / 180.0
        let tipX = center.x + r * cos(mathRad)
        let tipY = center.y - r * sin(mathRad)
        
        // Tangent direction
        let tangentAngle = mathRad + (isPositive ? .pi / 2 : -.pi / 2)
        let arrowLen: CGFloat = 8
        let arrowAngleSpread: Double = .pi / 6
        
        let p1 = CGPoint(
            x: tipX - arrowLen * cos(tangentAngle - arrowAngleSpread),
            y: tipY + arrowLen * sin(tangentAngle - arrowAngleSpread)
        )
        let p2 = CGPoint(
            x: tipX - arrowLen * cos(tangentAngle + arrowAngleSpread),
            y: tipY + arrowLen * sin(tangentAngle + arrowAngleSpread)
        )
        
        var arrowPath = Path()
        arrowPath.move(to: CGPoint(x: tipX, y: tipY))
        arrowPath.addLine(to: p1)
        arrowPath.addLine(to: p2)
        arrowPath.closeSubpath()
        context.fill(arrowPath, with: .color(color))
    }
    
    // MARK: - Quadrant Badges
    
    @ViewBuilder
    private func quadrantOverlayBadges(center: CGPoint, radius: CGFloat) -> some View {
        let offset = radius * 0.72
        
        // I Quadrant (top right)
        quadrantBadge(name: "I", isSelected: result.quadrant == .first)
            .position(x: center.x + offset, y: center.y - offset)
        
        // II Quadrant (top left)
        quadrantBadge(name: "II", isSelected: result.quadrant == .second)
            .position(x: center.x - offset, y: center.y - offset)
        
        // III Quadrant (bottom left)
        quadrantBadge(name: "III", isSelected: result.quadrant == .third)
            .position(x: center.x - offset, y: center.y + offset)
        
        // IV Quadrant (bottom right)
        quadrantBadge(name: "IV", isSelected: result.quadrant == .fourth)
            .position(x: center.x + offset, y: center.y + offset)
    }
    
    private func quadrantBadge(name: String, isSelected: Bool) -> some View {
        Text(name)
            .font(.system(size: 14, weight: isSelected ? .heavy : .semibold))
            .foregroundColor(isSelected ? .white : .secondary)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(
                Capsule()
                    .fill(isSelected ? Color.blue : Color.gray.opacity(0.18))
                    .shadow(color: isSelected ? Color.blue.opacity(0.4) : Color.clear, radius: 4, x: 0, y: 2)
            )
    }
    
    // MARK: - Axis Labels Overlay
    
    @ViewBuilder
    private func axisLabelsOverlay(center: CGPoint, radius: CGFloat) -> some View {
        let labelOffset: CGFloat = 24
        
        // 0° / 360° (Right)
        tickBadgeView(title: "360° (0°)", subTitle: "2π", isNearest: result.nearestTicks.contains(360))
            .position(x: center.x + radius + labelOffset + 24, y: center.y)
        
        // 90° (Top)
        tickBadgeView(title: "90°", subTitle: "π/2", isNearest: result.nearestTicks.contains(90))
            .position(x: center.x, y: center.y - radius - labelOffset)
        
        // 180° (Left)
        tickBadgeView(title: "180°", subTitle: "π", isNearest: result.nearestTicks.contains(180))
            .position(x: center.x - radius - labelOffset - 18, y: center.y)
        
        // 270° (Bottom)
        tickBadgeView(title: "270°", subTitle: "3π/2", isNearest: result.nearestTicks.contains(270))
            .position(x: center.x, y: center.y + radius + labelOffset)
    }
    
    private func tickBadgeView(title: String, subTitle: String, isNearest: Bool) -> some View {
        VStack(spacing: 1) {
            Text(title)
                .font(.system(size: 11, weight: isNearest ? .heavy : .bold))
                .foregroundColor(isNearest ? .orange : .primary)
            Text(subTitle)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(isNearest ? .orange.opacity(0.9) : .secondary)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isNearest ? Color.orange.opacity(0.15) : Color.clear)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(isNearest ? Color.orange.opacity(0.7) : Color.clear, lineWidth: 1.5)
                )
        )
    }
}

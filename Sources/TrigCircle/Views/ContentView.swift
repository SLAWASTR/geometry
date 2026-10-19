import SwiftUI

public struct ContentView: View {
    @StateObject private var vm = TrigViewModel()
    
    public init() {}
    
    public var body: some View {
        HSplitView {
            // Left Pane: Input + Main Interactive Trigonometric Circle
            VStack(spacing: 12) {
                // Input Section (Single line or textbook fraction + Examples)
                InputSectionView(vm: vm)
                
                // Big Trigonometric Circle
                VStack(spacing: 8) {
                    CircleCanvasView(result: vm.angleResult) { selectedDegree in
                        vm.selectFromCircle(deg: selectedDegree)
                    }
                    .padding(6)
                    
                    // Slider & Stepper for Angle Exploration [-5000° ... +5000°]
                    VStack(spacing: 6) {
                        HStack(spacing: 10) {
                            Image(systemName: "dial.low")
                                .foregroundColor(.secondary)
                            
                            Slider(
                                value: Binding(
                                    get: { vm.sliderDegrees },
                                    set: { vm.sliderChanged(deg: $0) }
                                ),
                                in: -5000...5000,
                                step: 5
                            ) {
                                Text("Угол в градусах")
                            }
                            
                            Text("\(Int(vm.sliderDegrees))°")
                                .font(.system(size: 13, weight: .bold, design: .monospaced))
                                .frame(width: 65, alignment: .trailing)
                        }
                        
                        // Quick Jump Steppers (-360°, -90°, 0°, +90°, +360°)
                        HStack(spacing: 6) {
                            Text("Шаг оборота:")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            Button("−360°") {
                                let newDeg = max(-5000.0, vm.sliderDegrees - 360.0)
                                vm.sliderChanged(deg: newDeg)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.mini)
                            
                            Button("−90°") {
                                let newDeg = max(-5000.0, vm.sliderDegrees - 90.0)
                                vm.sliderChanged(deg: newDeg)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.mini)
                            
                            Button("0°") {
                                vm.sliderChanged(deg: 0.0)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.mini)
                            
                            Button("+90°") {
                                let newDeg = min(5000.0, vm.sliderDegrees + 90.0)
                                vm.sliderChanged(deg: newDeg)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.mini)
                            
                            Button("+360°") {
                                let newDeg = min(5000.0, vm.sliderDegrees + 360.0)
                                vm.sliderChanged(deg: newDeg)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.mini)
                            
                            Spacer()
                            
                            Text("диапазон: ±5000°")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.gray.opacity(0.08))
                    )
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Bottom Author Attribution
                HStack {
                    Spacer()
                    Text("автор - @slawastr 1-26 design")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    Spacer()
                }
                .padding(.top, 2)
            }
            .padding(16)
            .frame(minWidth: 500, maxWidth: .infinity)
            
            // Right Pane: Metrics + Step-by-Step Educational Solution
            ScrollView(.vertical, showsIndicators: true) {
                VStack(spacing: 14) {
                    // 4 Key Metrics Cards
                    MetricsCardsView(result: vm.angleResult)
                    
                    // Step-by-step school explanation
                    StepByStepView(vm: vm)
                }
                .padding(16)
            }
            .frame(minWidth: 420, maxWidth: 560)
        }
        .frame(minWidth: 960, minHeight: 680)
        .toolbar {
            ToolbarItem(placement: .navigation) {
                HStack(spacing: 8) {
                    Image(systemName: "circle.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Тригонометрический круг")
                            .font(.system(size: 14, weight: .bold))
                        Text("автор - @slawastr 1-26 design")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}

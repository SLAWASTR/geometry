import SwiftUI

public struct StepByStepView: View {
    @ObservedObject public var vm: TrigViewModel
    @Environment(\.colorScheme) private var colorScheme
    
    public init(vm: TrigViewModel) {
        self.vm = vm
    }
    
    public var body: some View {
        let result = vm.angleResult
        
        VStack(alignment: .leading, spacing: 12) {
            // Header with title and Copy Button
            HStack {
                Label("Пошаговое объяснение решения", systemImage: "text.book.closed.fill")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: {
                    vm.copySolutionText()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: vm.copiedToClipboard ? "checkmark" : "doc.on.doc")
                        Text(vm.copiedToClipboard ? "Скопировано!" : "Скопировать")
                    }
                    .font(.caption)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .tint(vm.copiedToClipboard ? .green : .secondary)
            }
            
            if !result.isValid {
                VStack(spacing: 8) {
                    Image(systemName: "pencil.and.outline")
                        .font(.system(size: 28))
                        .foregroundColor(.secondary)
                    Text("Введите угол в поле выше или выберите готовый пример, чтобы увидеть пошаговое решение.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                VStack(spacing: 10) {
                    ForEach(result.steps) { step in
                        stepCard(step: step)
                    }
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colorScheme == .dark ? Color(white: 0.12) : Color.white)
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.3 : 0.05), radius: 6, x: 0, y: 2)
        )
    }
    
    private func stepCard(step: CalculationStep) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Title Bar
            HStack(spacing: 8) {
                // Step Number Badge
                Text("\(step.stepNumber)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 20, height: 20)
                    .background(Circle().fill(Color.blue))
                
                Text(step.title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(step.summary)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundColor(.blue)
            }
            
            // Formula if present
            if let formula = step.formula {
                Text(formula)
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.blue.opacity(0.08))
                    )
            }
            
            // Text explanation
            Text(step.explanation)
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(.secondary)
                .lineSpacing(3)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(colorScheme == .dark ? Color(white: 0.16) : Color(white: 0.97))
        )
    }
}

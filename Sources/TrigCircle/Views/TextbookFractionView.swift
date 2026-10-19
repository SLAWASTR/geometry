import SwiftUI

public struct TextbookFractionView: View {
    @Binding var numeratorText: String
    @Binding var denominatorText: String
    @Binding var isNegative: Bool
    public var onCommit: () -> Void
    
    @Environment(\.colorScheme) private var colorScheme
    @FocusState private var isNumeratorFocused: Bool
    @FocusState private var isDenominatorFocused: Bool
    
    public init(
        numeratorText: Binding<String>,
        denominatorText: Binding<String>,
        isNegative: Binding<Bool>,
        onCommit: @escaping () -> Void
    ) {
        self._numeratorText = numeratorText
        self._denominatorText = denominatorText
        self._isNegative = isNegative
        self.onCommit = onCommit
    }
    
    public var body: some View {
        HStack(alignment: .center, spacing: 14) {
            // Sign Toggle Button (±)
            Button(action: {
                isNegative.toggle()
                onCommit()
            }) {
                Text(isNegative ? "−" : "+")
                    .font(.system(size: 26, weight: .bold, design: .serif))
                    .foregroundColor(isNegative ? .red : .primary)
                    .frame(width: 38, height: 38)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(isNegative ? Color.red.opacity(0.12) : Color.gray.opacity(0.15))
                    )
            }
            .buttonStyle(.plain)
            .help("Сменить знак угла (плюс / минус)")
            
            // Fraction Stack
            VStack(spacing: 4) {
                // Numerator Field
                HStack(spacing: 4) {
                    TextField("3π", text: $numeratorText)
                        .focused($isNumeratorFocused)
                        .textFieldStyle(.plain)
                        .font(.system(size: 20, weight: .semibold, design: .monospaced))
                        .multilineTextAlignment(.center)
                        .frame(minWidth: 80, maxWidth: 140)
                        .frame(height: 32)
                        .background(
                            RoundedRectangle(cornerRadius: 6)
                                .fill(colorScheme == .dark ? Color(white: 0.18) : Color(white: 0.94))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(isNumeratorFocused ? Color.blue : Color.clear, lineWidth: 1.5)
                        )
                        .onChange(of: numeratorText) { _ in onCommit() }
                }
                
                // Fraction Bar
                Rectangle()
                    .fill(Color.primary.opacity(0.8))
                    .frame(width: 130, height: 2.5)
                
                // Denominator Field
                HStack(spacing: 4) {
                    TextField("4", text: $denominatorText)
                        .focused($isDenominatorFocused)
                        .textFieldStyle(.plain)
                        .font(.system(size: 20, weight: .semibold, design: .monospaced))
                        .multilineTextAlignment(.center)
                        .frame(minWidth: 80, maxWidth: 140)
                        .frame(height: 32)
                        .background(
                            RoundedRectangle(cornerRadius: 6)
                                .fill(colorScheme == .dark ? Color(white: 0.18) : Color(white: 0.94))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(isDenominatorFocused ? Color.blue : Color.clear, lineWidth: 1.5)
                        )
                        .onChange(of: denominatorText) { _ in onCommit() }
                }
            }
            
            // Radian symbol
            Text("рад")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.secondary)
            
            Divider()
                .frame(height: 50)
                .padding(.horizontal, 4)
            
            // Quick Math helper buttons
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("Вставить π:")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    Button("+π") {
                        if !numeratorText.contains("π") && !numeratorText.contains("п") {
                            numeratorText += "π"
                        }
                        onCommit()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    
                    Button("Очистить") {
                        numeratorText = ""
                        denominatorText = "1"
                        isNegative = false
                        onCommit()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
                
                // Common Denominators Shortcuts
                HStack(spacing: 5) {
                    Text("Делитель:")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    ForEach(["2", "3", "4", "6"], id: \.self) { d in
                        Button("/\(d)") {
                            denominatorText = d
                            onCommit()
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.mini)
                        .tint(denominatorText == d ? .blue : .primary)
                    }
                }
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(colorScheme == .dark ? Color(white: 0.14) : Color(white: 0.96))
        )
    }
}

import SwiftUI

public struct InputSectionView: View {
    @ObservedObject public var vm: TrigViewModel
    @Environment(\.colorScheme) private var colorScheme
    @FocusState private var isFieldFocused: Bool
    
    public init(vm: TrigViewModel) {
        self.vm = vm
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Mode Switcher Header
            HStack {
                Text("Угол в радианах:")
                    .font(.headline)
                
                Spacer()
                
                Picker("Режим ввода", selection: $vm.inputMode) {
                    ForEach(InputMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 290)
                .onChange(of: vm.inputMode) { _ in
                    vm.commit()
                }
            }
            
            // Input Fields according to mode
            if vm.inputMode == .inline {
                HStack(spacing: 10) {
                    // Search/Input style Field
                    HStack(spacing: 8) {
                        Image(systemName: "function")
                            .foregroundColor(.secondary)
                        
                        TextField("Например: 3π/4, -16п/3, 17π/6...", text: $vm.rawInputText)
                            .focused($isFieldFocused)
                            .textFieldStyle(.plain)
                            .font(.system(size: 16, weight: .medium, design: .monospaced))
                            .onChange(of: vm.rawInputText) { _ in vm.commit() }
                        
                        if !vm.rawInputText.isEmpty {
                            Button(action: { vm.clear() }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(colorScheme == .dark ? Color(white: 0.16) : Color(white: 0.95))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(isFieldFocused ? Color.blue : Color.gray.opacity(0.2), lineWidth: 1.5)
                    )
                    
                    // Quick Symbols
                    HStack(spacing: 6) {
                        Button("π") {
                            vm.rawInputText += "π"
                            vm.commit()
                        }
                        .buttonStyle(.bordered)
                        
                        Button("/") {
                            vm.rawInputText += "/"
                            vm.commit()
                        }
                        .buttonStyle(.bordered)
                        
                        Button("−") {
                            if vm.rawInputText.hasPrefix("-") {
                                vm.rawInputText.removeFirst()
                            } else {
                                vm.rawInputText = "-" + vm.rawInputText
                            }
                            vm.commit()
                        }
                        .buttonStyle(.bordered)
                        
                        Button("Очистить") {
                            vm.clear()
                        }
                        .buttonStyle(.bordered)
                    }
                }
            } else {
                TextbookFractionView(
                    numeratorText: $vm.fracNumerator,
                    denominatorText: $vm.fracDenominator,
                    isNegative: $vm.fracNegative,
                    onCommit: { vm.commit() }
                )
            }
            
            // Error Message (if any)
            if !vm.angleResult.isValid, let error = vm.angleResult.errorMessage, !vm.rawInputText.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text(error)
                        .font(.callout)
                        .foregroundColor(.primary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.orange.opacity(0.12))
                )
            }
            
            // Examples Pills
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("Примеры из учебника:")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text("(нажмите для решения)")
                        .font(.caption)
                        .foregroundColor(.secondary.opacity(0.8))
                }
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.examples) { ex in
                            Button(action: {
                                vm.selectExample(ex.value)
                            }) {
                                HStack(spacing: 4) {
                                    Text(ex.label)
                                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                                    Text("•")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Text(ex.note)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(
                                    Capsule()
                                        .fill(vm.rawInputText == ex.value ? Color.blue.opacity(0.2) : Color.gray.opacity(0.12))
                                )
                                .overlay(
                                    Capsule()
                                        .stroke(vm.rawInputText == ex.value ? Color.blue : Color.clear, lineWidth: 1.5)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 2)
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
}

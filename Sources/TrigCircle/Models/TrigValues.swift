import Foundation

public struct TrigValuesHelper {
    public static func computeValues(for normalizedDegrees: Double) -> ExactTrigValues {
        let rad = normalizedDegrees * .pi / 180.0
        let sinVal = sin(rad)
        let cosVal = cos(rad)
        let tanVal: Double? = abs(cosVal) < 1e-9 ? nil : tan(rad)
        let cotVal: Double? = abs(sinVal) < 1e-9 ? nil : 1.0 / tan(rad)
        
        let intDeg = Int(round(normalizedDegrees))
        let isIntDegree = abs(normalizedDegrees - Double(intDeg)) < 1e-5
        
        var sinStr = String(format: "%.3f", sinVal)
        var cosStr = String(format: "%.3f", cosVal)
        var tanStr = tanVal != nil ? String(format: "%.3f", tanVal!) : "не существует"
        var cotStr = cotVal != nil ? String(format: "%.3f", cotVal!) : "не существует"
        
        if isIntDegree {
            let deg = (intDeg % 360 + 360) % 360
            switch deg {
            case 0:
                sinStr = "0"
                cosStr = "1"
                tanStr = "0"
                cotStr = "не существует"
            case 30:
                sinStr = "1/2"
                cosStr = "√3/2"
                tanStr = "√3/3"
                cotStr = "√3"
            case 45:
                sinStr = "√2/2"
                cosStr = "√2/2"
                tanStr = "1"
                cotStr = "1"
            case 60:
                sinStr = "√3/2"
                cosStr = "1/2"
                tanStr = "√3"
                cotStr = "√3/3"
            case 90:
                sinStr = "1"
                cosStr = "0"
                tanStr = "не существует"
                cotStr = "0"
            case 120:
                sinStr = "√3/2"
                cosStr = "-1/2"
                tanStr = "-√3"
                cotStr = "-√3/3"
            case 135:
                sinStr = "√2/2"
                cosStr = "-√2/2"
                tanStr = "-1"
                cotStr = "-1"
            case 150:
                sinStr = "1/2"
                cosStr = "-√3/2"
                tanStr = "-√3/3"
                cotStr = "-√3"
            case 180:
                sinStr = "0"
                cosStr = "-1"
                tanStr = "0"
                cotStr = "не существует"
            case 210:
                sinStr = "-1/2"
                cosStr = "-√3/2"
                tanStr = "√3/3"
                cotStr = "√3"
            case 225:
                sinStr = "-√2/2"
                cosStr = "-√2/2"
                tanStr = "1"
                cotStr = "1"
            case 240:
                sinStr = "-√3/2"
                cosStr = "-1/2"
                tanStr = "√3"
                cotStr = "√3/3"
            case 270:
                sinStr = "-1"
                cosStr = "0"
                tanStr = "не существует"
                cotStr = "0"
            case 300:
                sinStr = "-√3/2"
                cosStr = "1/2"
                tanStr = "-√3"
                cotStr = "-√3/3"
            case 315:
                sinStr = "-√2/2"
                cosStr = "√2/2"
                tanStr = "-1"
                cotStr = "-1"
            case 330:
                sinStr = "-1/2"
                cosStr = "√3/2"
                tanStr = "-√3/3"
                cotStr = "-√3"
            default:
                break
            }
        }
        
        return ExactTrigValues(
            sinExact: sinStr,
            cosExact: cosStr,
            tanExact: tanStr,
            cotExact: cotStr,
            sinApprox: sinVal,
            cosApprox: cosVal,
            tanApprox: tanVal,
            cotApprox: cotVal
        )
    }
}

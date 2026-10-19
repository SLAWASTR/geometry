// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TrigCircle",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "TrigCircle", targets: ["TrigCircle"])
    ],
    targets: [
        .executableTarget(
            name: "TrigCircle",
            path: "Sources/TrigCircle"
        )
    ]
)

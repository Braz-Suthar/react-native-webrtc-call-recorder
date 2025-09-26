require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "WebrtcCallRecorder"
  s.version      = package["version"]
  s.summary      = package["description"] || "WebRTC call recorder for React Native"
  s.license      = package["license"] || "MIT"
  s.homepage     = package["homepage"] || "https://github.com/your-org/webrtc-local-recorder"
  s.author       = package["author"] || "Your Name"
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/your-org/webrtc-local-recorder.git" }
  s.source_files = "ios/**/*.{h,m}"
  s.requires_arc = true
  s.dependency "React-Core"
end

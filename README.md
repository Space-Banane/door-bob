# Door Bob – A Door Opening App for your ESP32

Door Bob is a simple IoT project that lets you open a door (or press a button) remotely using an ESP32 microcontroller and a servo. The ESP32 hosts a web server with a minimal UI, and you can control it via a mobile app (React Native/Expo) or any browser.

## Features

- ESP32 firmware to control a servo via WiFi
- Web interface for manual control
- Mobile app (React Native/Expo) for easy access
- Multi-language support (EN/DE/FR)
- Secure API URL and language storage

## Hardware Requirements

- ESP32 board
- Servo motor (e.g., SG90)
- Wires, power supply, and basic tools

## ESP32 Setup

1. **Wiring:**  
   Connect the servo signal wire to GPIO 18 (default, configurable in code).  
   Power the servo appropriately.

2. **Flashing:**  
   - Open `esp32.ino` in Arduino IDE or PlatformIO.
   - Set your WiFi SSID and password in the code:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     ```
   - Upload to your ESP32.

3. **Usage:**  
   - ESP32 will connect to WiFi and print its IP address via Serial.
   - Open the IP in your browser to access the web UI.
   - The API endpoint for triggering the servo is:  
     `http://<ESP32_IP>/api/click` (POST request)

## Mobile App

The app is in `/app/index.tsx` and built with React Native (Expo).

### Running the App

1. Install [Node.js](https://nodejs.org/) and [Expo CLI](https://docs.expo.dev/get-started/installation/).
2. In the project folder, run:
   ```sh
   cd app
   npm install
   expo start
   ```
3. Open the app on your device using the Expo Go app.

### Download APK

You can also download the latest Android APK from the [Releases](https://github.com/Space-Banane/door-bob/releases) tab on GitHub.

### Configuration

- Tap ⚙️ Settings in the app to set the ESP32 API URL and language.
- The API URL should be the full address, e.g. `http://192.168.178.59/api/click`.

## Customization

- Change the servo pin or positions in `esp32.ino` as needed.
- Add more languages or UI tweaks in `app/index.tsx`.

## Security

- This project is for home/lab use only.  
  **Do not expose the ESP32 API to the public internet without authentication!**

## License

MIT License.  
See [LICENSE](LICENSE) for details.

---
Made with ❤️ for fun and learning.

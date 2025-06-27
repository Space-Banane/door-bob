#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// --- CONFIGURATION ---
const char* ssid = "Your_SSID"; // Change to your WiFi SSID
const char* password = "Your_PASSWORD"; // Change to your WiFi password
const int SERVO_PIN = 18; // Change as needed
const int SERVO_POS_IDLE = 90;
const int SERVO_POS_CLICK = 119;
const int SERVO_DELAY = 400; // ms

Servo servo;
WebServer server(80);

// --- HTML PAGE ---
const char MAIN_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Switch Bot</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
  <div class="bg-white p-8 rounded shadow text-center">
    <h1 class="text-2xl font-bold mb-4">Switch Bot</h1>
    <button id="clickBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Click!
    </button>
    <div id="status" class="mt-4 text-gray-700"></div>
  </div>
  <script>
    document.getElementById('clickBtn').onclick = async function() {
      document.getElementById('status').innerText = "Clicking...";
      let res = await fetch('/api/click', {method: 'POST'});
      let txt = await res.text();
      document.getElementById('status').innerText = txt;
    }
  </script>
</body>
</html>
)rawliteral";

// --- HANDLERS ---
void handleRoot() {
  server.send_P(200, "text/html", MAIN_page);
}

void handleClick() {
  // Move servo to click position, then back
  servo.write(SERVO_POS_CLICK);
  delay(SERVO_DELAY);
  servo.write(SERVO_POS_IDLE);
  server.send(200, "text/plain", "Clicked!");
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  // Servo setup
  servo.attach(SERVO_PIN);
  servo.write(SERVO_POS_IDLE);

  // WiFi setup
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  // Web server routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/click", HTTP_POST, handleClick);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  // put your main code here, to run repeatedly:
  server.handleClient();
}

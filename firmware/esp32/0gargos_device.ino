#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>

// === Pin mapping (provided) ===
#define TFT_CS   15
#define TFT_DC   2
#define TFT_RST  4
#define TFT_MOSI 23
#define TFT_SCK  18
#define TFT_MISO 19

#define BTN_PIN  21

// ST7789 driver (2.4" commonly 240x320)
Adafruit_ST7789 tft(TFT_CS, TFT_DC, TFT_RST);

// === Configure these ===
static const char* WIFI_SSID = "Reffiw";
static const char* WIFI_PASS = "123321123";

static const char* APP_BASE_URL = "http://172.20.10.7:3000";

// Device identifier (used for polling)
static const char* DEVICE_ID = "device-001";

// TODO (MVP): Replace with real secp256k1 device signing.
// For now we return a dummy signature string so you can wire the end-to-end flow.
String signUserOpHashDummy(const String& userOpHashHex) {
  // MUST be 65-byte signature (r,s,v) eventually.
  return String("0x") + "00";
}

void drawStatus(const char* title, const char* line1 = "", const char* line2 = "") {
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(2);
  tft.setCursor(10, 10);
  tft.println(title);
  tft.setTextSize(1);
  tft.setCursor(10, 40);
  tft.println(line1);
  tft.setCursor(10, 55);
  tft.println(line2);
}

bool httpGetJson(const String& url, JsonDocument& doc) {
  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  if (code != 200) {
    http.end();
    return false;
  }
  String payload = http.getString();
  http.end();
  DeserializationError err = deserializeJson(doc, payload);
  return !err;
}

bool httpPostJson(const String& url, const JsonDocument& body, JsonDocument& resp) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String out;
  serializeJson(body, out);
  int code = http.POST(out);
  if (code != 200) {
    http.end();
    return false;
  }
  String payload = http.getString();
  http.end();
  DeserializationError err = deserializeJson(resp, payload);
  return !err;
}

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);

  // Bind SPI pins explicitly for ESP32
  SPI.begin(TFT_SCK, TFT_MISO, TFT_MOSI, TFT_CS);

  // Init ST7789 (width, height)
  tft.init(240, 320);
  tft.setRotation(1);
  drawStatus("0GArgos", "Booting...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  drawStatus("0GArgos", "Connecting WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
  }
  drawStatus("0GArgos", "WiFi connected", WiFi.localIP().toString().c_str());
  delay(600);
}

void loop() {
  // 1) Poll server for pending request
  StaticJsonDocument<2048> pollDoc;
  String pollUrl = String(APP_BASE_URL) + "/api/device/poll?deviceId=" + DEVICE_ID;

  bool ok = httpGetJson(pollUrl, pollDoc);
  if (!ok) {
    drawStatus("0GArgos", "Poll failed", pollUrl.c_str());
    delay(1500);
    return;
  }

  bool hasRequest = pollDoc["hasRequest"] | false;
  if (!hasRequest) {
    drawStatus("0GArgos", "No request", "Waiting...");
    delay(1000);
    return;
  }

  const char* requestId = pollDoc["requestId"] | "";
  const char* title = pollDoc["title"] | "Approval";
  const char* details1 = pollDoc["details1"] | "";
  const char* details2 = pollDoc["details2"] | "";
  const char* userOpHash = pollDoc["userOpHash"] | "";

  drawStatus(title, details1, details2);
  tft.setCursor(10, 80);
  tft.setTextSize(1);
  tft.println("Press button to approve");

  // 2) Wait for button press
  while (digitalRead(BTN_PIN) == HIGH) {
    delay(10);
  }

  // Simple debounce
  delay(50);
  while (digitalRead(BTN_PIN) == LOW) delay(10);

  drawStatus("Approving...", requestId);

  // 3) Sign and send response
  String deviceSig = signUserOpHashDummy(userOpHash);

  StaticJsonDocument<1024> body;
  body["deviceId"] = DEVICE_ID;
  body["requestId"] = requestId;
  body["approved"] = true;
  body["deviceSignature"] = deviceSig;
  body["userOpHash"] = userOpHash;

  StaticJsonDocument<1024> resp;
  String respondUrl = String(APP_BASE_URL) + "/api/device/respond";
  bool postOk = httpPostJson(respondUrl, body, resp);
  if (!postOk) {
    drawStatus("Error", "Send failed");
    delay(1500);
    return;
  }

  drawStatus("Done", "Approved + sent");
  delay(1000);
}

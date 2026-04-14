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
static const char* WIFI_SSID = "YOUR_WIFI_SSID";
static const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Web app base URL (must be reachable from ESP32)
// Example: http://192.168.1.20:3000
static const char* APP_BASE_URL = "http://YOUR_PC_LAN_IP:3000";

// Device identifier (used for polling)
static const char* DEVICE_ID = "device-001";

// TODO (MVP): Replace with real secp256k1 device signing.
// For now we return a dummy signature string so you can wire the end-to-end flow.
String signUserOpHashDummy(const String& userOpHashHex) {
  // MUST be 65-byte signature (r,s,v) eventually.
  return String("0x") + "00";
}

// UI / layout
static const int SCREEN_W = 320; // rotation=1
static const int SCREEN_H = 240; // rotation=1
uint16_t COLOR_ACCENT = 0; // set in setup()

void clearScreen() {
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextWrap(true);
}

void drawHeader(const char* title) {
  tft.fillRect(0, 0, SCREEN_W, 32, ST77XX_BLACK);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(2);
  tft.setCursor(10, 7);
  tft.print(title);
  tft.drawFastHLine(0, 32, SCREEN_W, ST77XX_WHITE);
}

void drawStatus(const char* title, const char* line1 = "", const char* line2 = "") {
  clearScreen();
  drawHeader(title);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(2);
  tft.setCursor(10, 52);
  tft.println(line1);
  tft.setCursor(10, 82);
  tft.println(line2);
}

bool waitForButtonPress() {
  // Active LOW
  if (digitalRead(BTN_PIN) == HIGH) return false;
  delay(35);
  if (digitalRead(BTN_PIN) == HIGH) return false;
  while (digitalRead(BTN_PIN) == LOW) delay(10);
  delay(35);
  return true;
}

String shortenHex(const String& hex, int head = 8, int tail = 6) {
  if (hex.length() <= (2 + head + tail)) return hex;
  return hex.substring(0, 2 + head) + "…" + hex.substring(hex.length() - tail);
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

bool httpPostJson(const String& url, const JsonDocument& body, JsonDocument& resp, int* outCode) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String out;
  serializeJson(body, out);
  int code = http.POST(out);
  if (outCode) *outCode = code;
  String payload = http.getString();
  if (code < 200 || code >= 300) {
    http.end();
    return false;
  }
  http.end();
  // Best-effort parsing. Even if parsing fails, HTTP 2xx means "sent".
  deserializeJson(resp, payload);
  return true;
}

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);

  // Bind SPI pins explicitly for ESP32
  SPI.begin(TFT_SCK, TFT_MISO, TFT_MOSI, TFT_CS);

  // Init ST7789 (width, height)
  tft.init(240, 320);
  tft.setRotation(1);
  COLOR_ACCENT = tft.color565(0x95, 0x4f, 0x1f);
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

  // Show request with larger text
  clearScreen();
  drawHeader("0GArgos");
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(2);
  tft.setCursor(10, 44);
  tft.println(title);

  tft.setCursor(10, 74);
  tft.println(details1);
  tft.setCursor(10, 104);
  tft.println(details2);

  tft.setTextSize(1);
  tft.setCursor(10, 128);
  tft.print("Hash: ");
  tft.println(shortenHex(String(userOpHash)));

  // Require sequence approval pattern: 3-4-1-2
  const int pattern[4] = {3, 4, 1, 2};
  const int len = 4;

  auto drawPattern = [&](int currentIdx, int currentCount, int targetCount) {
    int tileW = 56, tileH = 56, gap = 14;
    int totalW = len * tileW + (len - 1) * gap;
    int startX = (SCREEN_W - totalW) / 2;
    int y = 160;
    for (int i = 0; i < len; i++) {
      int x = startX + i * (tileW + gap);
      bool done = i < currentIdx;
      bool active = i == currentIdx;
      uint16_t border = done ? COLOR_ACCENT : (active ? COLOR_ACCENT : ST77XX_WHITE);
      tft.fillRoundRect(x, y, tileW, tileH, 12, ST77XX_BLACK);
      tft.drawRoundRect(x, y, tileW, tileH, 12, border);
      tft.setTextSize(3);
      tft.setTextColor(done ? COLOR_ACCENT : (active ? ST77XX_WHITE : ST77XX_WHITE));
      tft.setCursor(x + 18, y + 16);
      tft.print(pattern[i]);
      if (active) {
        int dotY = y + tileH - 10;
        for (int k = 0; k < targetCount; k++) {
          int dotX = x + 10 + k * 10;
          uint16_t c = (k < currentCount) ? COLOR_ACCENT : ST77XX_WHITE;
          tft.fillCircle(dotX, dotY, 3, c);
        }
      }
    }
  };

  // Instruction
  tft.setTextSize(1);
  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(10, 144);
  tft.print("Confirm sequence: 3-4-1-2");

  for (int idx = 0; idx < len; idx++) {
    int target = pattern[idx];
    int count = 0;

    // redraw pattern area
    tft.fillRect(0, 152, SCREEN_W, 88, ST77XX_BLACK);
    drawPattern(idx, count, target);

    // Step prompt
    tft.fillRect(0, 136, SCREEN_W, 14, ST77XX_BLACK);
    tft.setCursor(10, 136);
    tft.setTextColor(COLOR_ACCENT);
    tft.print("Tap ");
    tft.print(target);
    tft.print("x");

    while (count < target) {
      if (waitForButtonPress()) {
        count++;
        tft.fillRect(0, 152, SCREEN_W, 88, ST77XX_BLACK);
        drawPattern(idx, count, target);
      }
      delay(10);
    }
    delay(200);
  }

  drawStatus("Sending...", requestId);

  // 3) Sign and send response
  String deviceSig = signUserOpHashDummy(userOpHash);

  StaticJsonDocument<1024> body;
  body["deviceId"] = DEVICE_ID;
  body["requestId"] = requestId;
  body["approved"] = true;
  body["deviceSignature"] = deviceSig;
  body["userOpHash"] = userOpHash;

  StaticJsonDocument<4096> resp;
  String respondUrl = String(APP_BASE_URL) + "/api/device/respond";
  int httpCode = 0;
  bool postOk = httpPostJson(respondUrl, body, resp, &httpCode);
  if (!postOk) {
    String line2 = String("HTTP ") + String(httpCode);
    drawStatus("Error", "Send failed", line2.c_str());
    delay(1500);
    return;
  }

  const char* root = resp["storageRootHash"] | "";
  if (root && String(root).length() > 0) {
    String line2 = String("Storage: ") + shortenHex(String(root), 6, 6);
    drawStatus("Done", "Approved", line2.c_str());
  } else {
    drawStatus("Done", "Approved + sent");
  }
  delay(1000);
}

# ESP32-S3 firmware (Arduino)

Target hardware:
- ESP32-S3 dev board
- 2.4" SPI TFT (ST7789, 240x320)
- 1 push button

Pin mapping:

```c
#define TFT_CS   15
#define TFT_DC   2
#define TFT_RST  4
#define TFT_MOSI 23
#define TFT_SCK  18
#define TFT_MISO 19

#define BTN_PIN  21
```

## What the firmware does (MVP)

1) Polls the web app for a pending approval request.
2) Displays the request details on the TFT.
3) On button press:
   - Approve: signs the `userOpHash` and sends the signature back to the web app.
   - (Long press later can be used for Deny.)

## Dependencies (Arduino Library Manager)

- `Adafruit GFX Library`
- `Adafruit ST7789 and ST7735 Library`
- `ArduinoJson`

## Crypto note

For MVP we use a provisioned **secp256k1** key on the device and sign the 32-byte `userOpHash`.
You can implement secp256k1 ECDSA using e.g. micro-ecc (uECC) configured for secp256k1,
or another Arduino-compatible secp256k1 library.

#include <Wire.h>
#include <SimpleFOC.h>
#include "SparkFun_TMAG5273_Arduino_Library.h"

#define uh16        16
#define ul17        17
#define vh18        18
#define wh19        19
#define vl23        23
#define wl33        33
#define curSense    32
#define STANDBY_PIN 25

BLDCMotor motor = BLDCMotor(7);
BLDCDriver6PWM driver = BLDCDriver6PWM(uh16, ul17, vh18, vl23, wh19, wl33, curSense);

TMAG5273 tmag;
void initSensor();
float readSensor();
GenericSensor sensor = GenericSensor(readSensor, initSensor);

float target_velocity     = -6;
float smoothVel           = 0;
float lastAngle           = 0;
unsigned long lastVelTime    = 0;
unsigned long lastPrintTime  = 0;
unsigned long motorStartTime = 0;
unsigned long touchedTime    = 0;
unsigned long pulseStart     = 0;
bool motorRunning         = true;
int pulsePhase            = 0;
float pulseStartAngle     = 0;
float pulseMove           = 0;
int pulseSuccessCount     = 0;

#define SPINUP_MS         2000
#define TOUCH_DIFF        80
#define DEAD_TIME_MS      1000
#define PULSE_MS          125
#define PULSE_VOLTAGE     0.4
#define PULSE_MOVE_MIN    3
#define PULSE_MOVE_MAX    4.5

void enableMotor() {
  digitalWrite(STANDBY_PIN, HIGH);
  Serial.println(">>> MOTOR ENABLED");
}
void disableMotor() {
  digitalWrite(STANDBY_PIN, LOW);
  Serial.println(">>> MOTOR DISABLED");
}

void initSensor() {
  Wire.begin();
  if (tmag.begin(TMAG5273_I2C_ADDRESS_INITIAL, Wire) != true) {
    Serial.println("ERROR: TMAG5273 not found");
    while (1);
  }
  tmag.setConvAvg(TMAG5273_X32_CONVERSION);
  tmag.setMagneticChannel(TMAG5273_XYX_ENABLE);
  tmag.setAngleEn(TMAG5273_XY_ANGLE_CALCULATION);
}

float readSensor() {
  return tmag.getAngleResult() * PI / 180.0;
}

float getAngleMoved(float startAngle) {
  float endAngle = tmag.getAngleResult();
  float moved    = endAngle - startAngle;
  if (moved >  180.0) moved -= 360.0;
  if (moved < -180.0) moved += 360.0;
  return abs(moved);
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== BOOT ===");
  pinMode(STANDBY_PIN, OUTPUT);
  enableMotor();
  sensor.init();

  driver.voltage_power_supply = 3.3;
  driver.pwm_frequency = 20000;
  driver.voltage_limit = 4;
  driver.init();
  Serial.print("Driver initialized: ");
  Serial.println(driver.initialized ? "YES" : "NO");

  motor.linkDriver(&driver);
  motor.linkSensor(&sensor);
  motor.voltage_limit   = 3.0;
  motor.velocity_limit  = 10.0;
  motor.controller      = MotionControlType::velocity;
  motor.PID_velocity.P  = 0.05;
  motor.PID_velocity.I  = 0.25;
  motor.PID_velocity.D  = 0.0;
  motor.LPF_velocity.Tf = 0.15;
  motor.init();
  motor.initFOC();

  lastVelTime    = millis();
  motorStartTime = millis();
  Serial.println("=== RUNNING ===");
}

void loop() {
  motor.loopFOC();

  if (motorRunning) {
    float t = constrain((float)(millis() - motorStartTime) / SPINUP_MS, 0.0, 1.0);
    motor.move(target_velocity * t);
  } else if (pulsePhase == 1) {
    motor.move(target_velocity);
  }

  sensor.update();

  unsigned long now = millis();

  if (now - lastVelTime >= 50) {
    float angle  = tmag.getAngleResult();
    float dAngle = angle - lastAngle;
    if (dAngle >  180.0) dAngle -= 360.0;
    if (dAngle < -180.0) dAngle += 360.0;
    float rawVel = dAngle / 0.05;
    smoothVel   = 0.7 * smoothVel + 0.3 * rawVel;
    lastAngle   = angle;
    lastVelTime = now;
  }

  int vp   = analogRead(36);
  int vn   = analogRead(39);
  int diff = abs(vp - vn);

  bool spunUp = (now - motorStartTime > SPINUP_MS);

  // --- TOUCH DETECTION ---
  if (spunUp && motorRunning && pulsePhase == 0) {
    if (diff > TOUCH_DIFF) {
      disableMotor();
      motor.disable();
      motorRunning      = false;
      pulsePhase        = 0;
      touchedTime       = now;
      pulseSuccessCount = 0;
      Serial.println("STATE: TOUCHED");
      Serial.print("  diff: "); Serial.println(diff);
      Serial.print("  smoothVel: "); Serial.println(smoothVel);
    }
  }

  // --- DEAD TIME DONE → fire pulse ---
  if (!motorRunning && pulsePhase == 0) {
    if (now - touchedTime > DEAD_TIME_MS) {
      driver.voltage_limit = PULSE_VOLTAGE;
      enableMotor();
      motor.enable();
      pulseStartAngle = tmag.getAngleResult();
      pulsePhase      = 1;
      pulseStart      = now;
      Serial.println("PULSE firing...");
    }
  }

  // --- PULSE DONE → measure → evaluate ---
  if (pulsePhase == 1 && now - pulseStart > PULSE_MS) {
    pulseMove = getAngleMoved(pulseStartAngle);
    disableMotor();
    motor.disable();
    driver.voltage_limit = 4;
    pulsePhase = 0;

    Serial.print("moved: "); Serial.print(pulseMove, 2);
    Serial.print(" deg  (band "); Serial.print(PULSE_MOVE_MIN);
    Serial.print("-"); Serial.print(PULSE_MOVE_MAX); Serial.println(")");

    if (pulseMove > PULSE_MOVE_MIN && pulseMove < PULSE_MOVE_MAX) {
      pulseSuccessCount++;
      Serial.print("SUCCESS #"); Serial.println(pulseSuccessCount);

      if (pulseSuccessCount >= 1) {
        pulseSuccessCount = 0;
        motor.PID_velocity.reset();
        enableMotor();
        motor.enable();
        motorRunning   = true;
        motorStartTime = now;
        Serial.println("STATE: RUNNING");
      } else {
        touchedTime = now;
        Serial.println("one success, confirming...");
      }

    } else {
      pulseSuccessCount = 0;
      touchedTime = now;
      if (pulseMove <= PULSE_MOVE_MIN) {
        Serial.println("HELD");
      } else {
        Serial.println("SPINNING");
      }
    }
  }

  // --- PERIODIC PRINT ---
  if (now - lastPrintTime > 200) {
    lastPrintTime = now;
    float rpm = abs(smoothVel) / 360.0 * 60.0;
    Serial.print("RPM: ");       Serial.print(rpm, 1);
    Serial.print(" | sVel: ");   Serial.print(smoothVel, 1);
    Serial.print(" | diff: ");   Serial.print(diff);
    Serial.print(" | spunUp: "); Serial.print(spunUp ? "Y" : "N");
    Serial.print(" | phase: ");  Serial.print(pulsePhase);
    Serial.print(" | pSucc: ");  Serial.print(pulseSuccessCount);
    Serial.print(" | STATE: ");  Serial.println(motorRunning ? "RUNNING" : "STOPPED");

    if (!motorRunning && pulsePhase == 0) {
      Serial.print("VEL: "); Serial.println(smoothVel, 1);
    }
  }
}

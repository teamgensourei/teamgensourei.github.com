const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const STATE_PATH = "./state.json";

function loadState() {
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
}
function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function addRecord(state, text) {
  state.records.push(`[${new Date().toISOString()}] ${text}`);
  if (state.records.length > 20) state.records.shift();
}

app.post("/command", (req, res) => {
  const { cmd } = req.body;
  let state = loadState();
  let output = "NO RESPONSE";

  if (state.flags.lockdown) {
    return res.json({
      output: "TERMINAL LOCKED",
      notice: "MULTIPLE UNAUTHORIZED OPERATIONS DETECTED"
    });
  }

  switch (cmd) {
    case "help":
      output =
        state.globalPhase === 0
          ? "available commands: help, status, observe"
          : "available commands: help, status, observe, trace, override";
      break;

    case "status":
      output = `PHASE: ${state.globalPhase}`;
      break;

    case "observe":
      output = state.flags.signalDetected
        ? "ANOMALOUS SIGNAL PRESENT"
        : "NO ANOMALY DETECTED";
      break;

    case "trace":
      if (state.globalPhase >= 1) {
        state.flags.signalDetected = true;
        addRecord(state, "SIGNAL TRACE CONFIRMED");
        output = "TRACE COMPLETE";
        saveState(state);
      } else {
        output = "INSUFFICIENT AUTHORITY";
      }
      break;

    case "override":
      if (state.globalPhase === 0 && !state.flags.overrideUsed) {
        state.globalPhase = 1;
        state.flags.overrideUsed = true;
        state.lastNotice = "UNAUTHORIZED ACCESS CONFIRMED";
        addRecord(state, "PHASE SHIFT OCCURRED");
        saveState(state);
        output = "ACCESS GRANTED";
      } else {
        state.flags.lockdown = true;
        state.lastNotice = "TERMINAL LOCKDOWN INITIATED";
        saveState(state);
        output = "ACCESS DENIED";
      }
      break;

    case "log":
      output =
        state.records.length === 0
          ? "NO RECORDS FOUND"
          : state.records.slice(-5).join("\n");
      break;

    default:
      output = "COMMAND NOT RECOGNIZED";
  }

  res.json({
    output,
    notice: state.lastNotice
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("FOURTH CONSOLE ONLINE");
});

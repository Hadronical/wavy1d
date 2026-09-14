import { setNewParameters, requestUpdate } from "./main.js";

let isRunning = false;
let dt = 0.005;
let iterations = 4;
var simRealDeltaTime = dt * iterations;

const runToggleBtn = document.getElementById("sim-run-toggle-btn");
const dtInp = document.getElementById("sim-dt-inp");
const iterationsInp = document.getElementById("sim-iterations-inp");
const stepBtn = document.getElementById("sim-step-btn");
const timeStepTxt = document.getElementById("sim-timestep-txt");

function updateTimeStep () {
    simRealDeltaTime = dt * iterations;
    timeStepTxt.textContent = simRealDeltaTime;
}

function setIsRunning (newIsRunning) {
    isRunning = newIsRunning;
    runToggleBtn.textContent = (isRunning) ? ("Pause") : ("Play");
    setNewParameters(isRunning, dt, iterations);
}

runToggleBtn.addEventListener("click", () => {
    setIsRunning(!isRunning);
});

stepBtn.addEventListener("click", () => {
    setIsRunning(false);
    requestUpdate();
});

dtInp.addEventListener("input", () => {
    dt = parseFloat(dtInp.value);
    if (!isNaN(dt) && dt >= 0) {
        setNewParameters(isRunning, dt, iterations);
        updateTimeStep();
    }
    else {
        dtInp.value = 0;
    }
});

iterationsInp.addEventListener("input", () => {
    iterations = parseInt(iterationsInp.value);
    if (!isNaN(iterations) && iterations >= 1) {
        setNewParameters(isRunning, dt, iterations);
        updateTimeStep();
    }
    else {
        iterationsInp.value = 1;
    }
});

updateTimeStep();
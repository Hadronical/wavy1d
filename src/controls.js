import { setNewParameters, requestUpdate } from "./main.js";

let isRunning = false;
let dt = 0.005;
let iterations = 4;
var timestep = dt * iterations;

const runToggleBtn = document.getElementById("sim-run-toggle-btn");
const dtInp = document.getElementById("sim-dt-inp");
const iterationsInp = document.getElementById("sim-iterations-inp");
const stepBtn = document.getElementById("sim-step-btn");
const timeStepTxt = document.getElementById("sim-timestep-txt");

function updateTimeStep () {
    timestep = dt * iterations;
    timeStepTxt.textContent = `Time-step/frame: ${timestep}`;
}

function setIsRunning (newIsRunning) {
    isRunning = newIsRunning;
    runToggleBtn.innerHTML = (isRunning) ? (`<span class="material-symbols-outlined">pause</span>`) : (`<span class="material-symbols-outlined">play_arrow</span>`);
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

setIsRunning(false);
updateTimeStep();
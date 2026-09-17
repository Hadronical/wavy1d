import { requestSetNewInitialValues } from "./main.js";


export const INITIAL_VALUE_TYPES = {
    DISPLACEMENT: "displacement",
    VELOCITY: "velocity"
};

const initialValuesList = document.getElementById("initial-values-list");
const emptyHint = document.getElementById("empty-hint");

const newType = document.getElementById("new-type");
const newFunction = document.getElementById("new-function");
const newIntervalMin = document.getElementById("new-interval-min");
const newIntervalMax = document.getElementById("new-interval-max");
const addBtn = document.getElementById("add-btn");

const setBtn = document.getElementById("set-btn");

/** @type {{id: Int, active: boolean, type: string, function: string, intervalMin: Float, intervalMax: Float}[]} */
let initialValues = [];
let idCounter = 0;

/**
 * 
 * @param {{id: Int, active: boolean, type: string, function: string, intervalMin: Float, intervalMax: Float}} row 
 * @returns {string} formatted HTML
 */
const generateRowHTMLTemplate = (row) => `
<div class="row-fields">
    <div class="field-type">
        <select aria-label="Type">
            <option value="${INITIAL_VALUE_TYPES.DISPLACEMENT}" ${row.type === INITIAL_VALUE_TYPES.DISPLACEMENT ? "selected" : ""}>${INITIAL_VALUE_TYPES.DISPLACEMENT}</option>
            <option value="${INITIAL_VALUE_TYPES.VELOCITY}" "${row.type === INITIAL_VALUE_TYPES.VELOCITY ? "selected" : ""}>${INITIAL_VALUE_TYPES.VELOCITY}</option>
        </select>
    </div>
    <div class="field-function">
        <input type="text" value="${escapeAttr(row.function)}" aria-label="function field">
    </div>
    <div class="field-interval-min">
        <input type="number" value="${row.intervalMin}" min="-1" max="1" id="new-interval-min" aria-label="interval min field">
    </div>
    <div class="field-interval-max">
        <input type="number" value="${row.intervalMax}" min="-1" max="1" id="new-interval-max" aria-label="interval max field">
    </div>
</div>
<div class="field-active">
    <input type="checkbox" name="initialValue${row.id}" id="initialValue${row.id}" ${row.active ? "checked" : ""}>
    <label for="initialValue${row.id}">Active</label>
    <button class="icon-btn" title="Delete row" aria-label="Delete row"><span class="material-symbols-outlined">delete_forever</span></button>
</div>`;

function render () {
    initialValuesList.innerHTML = "";
    emptyHint.style.display = initialValues.length === 0 ? "block" : "none";

    initialValues.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row list-row";

        // used for deletion
        rowDiv.dataset.id = row.id;
        // display (in)active
        if (!row.active) rowDiv.classList.add("inactive");

        rowDiv.innerHTML = generateRowHTMLTemplate(row);

        // field updates
        const typeSel = rowDiv.querySelector(".field-type select");
        const functionInp = rowDiv.querySelector(".field-function input");
        const intervalMinInp = rowDiv.querySelector(".field-interval-min input");
        const intervalMaxInp = rowDiv.querySelector(".field-interval-max input");
        const activeChk = rowDiv.querySelector(".field-active input");
        const deleteBtn = rowDiv.querySelector(".field-active .icon-btn");

        typeSel.addEventListener("change", () => { row.type = typeSel.value; });
        functionInp.addEventListener("input", () => { row.function = functionInp.value; });
        intervalMinInp.addEventListener("input", () => { row.intervalMin = parseFloat(intervalMinInp.value); });
        intervalMaxInp.addEventListener("input", () => { row.intervalMax = parseFloat(intervalMaxInp.value); });
        activeChk.addEventListener("change", () => {
            row.active = activeChk.checked;
            render();
        });
        deleteBtn.addEventListener("click", () => {
            // filter row from list of initial values by id
            initialValues = initialValues.filter((r) => r.id !== row.id);
            render();
        });

        initialValuesList.appendChild(rowDiv);
    });
}

function escapeAttr (str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

addBtn.addEventListener("click", () => {
    const isEmptyFunction = newFunction.value.trim().length == 0;

    const min = parseFloat(newIntervalMin.value);
    const max = parseFloat(newIntervalMax.value);
    const isInvalidInterval = (min < -1) || (max > 1) || (min > max);

    // if empty do nothing
    if (isEmptyFunction || isInvalidInterval) return;

    // create new initial values
    initialValues.push({
        id: idCounter++,
        active: true,
        type: newType.value,
        function: newFunction.value,
        intervalMin: min,
        intervalMax: max,
    });

    // reset to defaults
    newFunction.value = "";
    newIntervalMin.value = "-1";
    newIntervalMax.value = "1";
    newType.value = "displacement";
    render();
});

setBtn.addEventListener("click", () => {
    requestSetNewInitialValues(initialValues);
});


newFunction.value = "30 * Math.exp(-((10*x)**2)) * Math.sin(15*x*TWO_PI)";
addBtn.dispatchEvent(new Event("click"));
newFunction.value = "{x += 0.5; return -30 * Math.exp(-((10*x)**2));}";
addBtn.dispatchEvent(new Event("click"));

render();
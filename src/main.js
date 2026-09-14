//import * as math from "../libraries/math.min.js";

import { WORKGROUP_SIZE, simulationSetup, simulationUpdate } from "./webgpu.js";
import { INITIAL_VALUE_TYPES } from "./initialValuesList.js";


//===== constants =====

// gui constants
const cnv = document.getElementById("mainCanvas");
const ctx = cnv.getContext("2d");
const W = 800, W_2 = W / 2;
const H = 400, H_2 = H / 2;

const DISPLACEMENT_DEFAULT_HEIGHT = H - 80;
const ENERGY_DEFAULT_HEIGHT = H;

const RING_CENTER_X = W_2;
const RING_CENTER_Y = H_2 - 40;
const RING_RADIUS = 120;


// compute constants
const PI = Math.PI;
const TWO_PI = 2 * PI;
const HALF_PI = PI / 2;

// simulation parameters
let isRunning = false;
let dt = 0.005;
let iterations = 4;
let k = 500.0;
let N = 800;

let dx = W / N;

/** @type {Float[]} */
let val = new Array(N).fill(0.0);
/** @type {Float[]} */
let vel = new Array(N).fill(0.0);

let requiresNewSetup = true;
let requiresSetNewInitialValues = true;

/** @type {{id: Int, active: boolean, type: string, function: string, intervalMin: Float, intervalMax: Float}[]} */
let initialValues = [];
//val  |  30 * Math.exp( -((10 * x) ** 2) ) * Math.sin(15 * x * TWO_PI)  |  -1,1
//val  |  { x += 0.5; return  20 * Math.exp( -((8 * x) ** 2) ) * Math.sin(30 * x * TWO_PI); }  |  -1,1
//val  |  30 * Math.sin(16 * x * HALF_PI)  |  -1,1


//===== setup =====

// html setup
cnv.width = W;
cnv.height = H;

function setup () {
    // setup webgpu for simulation
    console.log(`Setting up webgpu: ${N} partitions, ${WORKGROUP_SIZE} threads per workgroup...`);

    simulationSetup(N);

    console.log("Setup complete!");
}

function setInitialValues () {
    console.log("Setting initial values...");

    val = new Array(N).fill(0.0);
    vel = new Array(N).fill(0.0);
    for (let initialValue of initialValues) {
        console.log(initialValue);

        const isInactive = !initialValue.active;
        const isEmptyFunction = initialValue.function.trim().length == 0;

        let isInvalidFunction = false;
        try {
            eval("x => " + initialValue.function)(0);
        } catch {
            isInvalidFunction = true;
            console.warn("Invalid initial value!");
        }

        if (isInactive || isEmptyFunction || isInvalidFunction) {
            console.log("Skipping initial value");
            continue;
        }

        initial_function(
            (initialValue.type === INITIAL_VALUE_TYPES.DISPLACEMENT) ? (val) : (vel),
            initialValue.intervalMin, initialValue.intervalMax,
            eval("x => " + initialValue.function)
        );
    }

    console.log("Initial values set!");
}


//===== draw frame =====

async function draw () {    
    if (requiresNewSetup) {
        setup();
        requiresNewSetup = false;
    }

    if (requiresSetNewInitialValues) {
        setInitialValues();
        requiresSetNewInitialValues = false;
    }

    if (isRunning) {
        // simulate
        await requestUpdate();
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0,0, W,H);

    draw_displacement();
    draw_energy();
    draw_ring();

    requestAnimationFrame(draw);
}

export async function requestUpdate () {
    const result = await simulationUpdate(val, vel, dt, iterations, k);

    // draw
    val = result.val;
    vel = result.vel;
}

requestAnimationFrame(draw);


//===== helper functions =====

/**
 * Perform new setup after current and before next frame
 * 
 * @param {Int} partitions 
 */
export function requestNewSetup (partitions) {
    requiresNewSetup = true;
    N = partitions;
}

/**
 * Set new initial values after current and before next frame
 * 
 * @param {{id: Int, type: INITIAL_VALUE_TYPES, function: string, intervalm: Float, intervalM: Float}[]} newInitialValues 
 */
export function requestSetNewInitialValues (newInitialValues) {
    requiresSetNewInitialValues = true;
    initialValues = newInitialValues;
}

/**
 * Set new simulation parameters
 * 
 * @param {Boolean} newIsRunning
 * @param {Float} newDT
 * @param {Int} newIterations
 */
export function setNewParameters (newIsRunning, newDT, newIterations) {
    isRunning = newIsRunning;
    dt = newDT;
    iterations = newIterations;
}

/**
 * [N] -> [-1, 1]
 * 
 * @param {Int} i 
 * @returns {Float}
 */
function index_to_space (i) {
    return 2 * (i / N) - 1;
}

/**
 * [-1, 1] -> [N]
 * 
 * @param {Float} x 
 * @returns {Int}
 */
function space_to_index (x) {
    return Math.round(0.5 * (x + 1) * N);
}

/**
 * initialize array of values to approximation of a function on a closed interval
 * contained within [-1,1]
 * 
 * @param {Float[]} medium array of values to set
 * @param {Float} domain_m min of interval
 * @param {Float} domain_M max of interval
 * @param {function(number): number} func function
 */
function initial_function (medium, domain_m,domain_M, func) {
    let m = space_to_index(domain_m);
    let M = space_to_index(domain_M);

    for (let i = m; i < M; i++) {
        medium[i] += func(index_to_space(i));
    }
}

/**
 * draw values as displacement from default height
 */
function draw_displacement () {
    ctx.strokeStyle = "black";

    // draw boundary
    ctx.strokeWeight = 2;

    ctx.beginPath();
    ctx.moveTo(0, DISPLACEMENT_DEFAULT_HEIGHT - 30);
    ctx.lineTo(0, DISPLACEMENT_DEFAULT_HEIGHT + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(W, DISPLACEMENT_DEFAULT_HEIGHT - 30);
    ctx.lineTo(W, DISPLACEMENT_DEFAULT_HEIGHT + 30);
    ctx.stroke();

    // draw displacement
    ctx.strokeWeight = 1;

    let x = 0;
    let y = DISPLACEMENT_DEFAULT_HEIGHT;

    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 1; i <= N; i++) {
        x += dx;
        y = DISPLACEMENT_DEFAULT_HEIGHT - val[i];
        ctx.lineTo(x, y);
        ctx.moveTo(x, y);
    }
    ctx.stroke();
}

/**
 * draw energy as displacement from default height
 */
function draw_energy () {
    ctx.strokeStyle = "rgba(160,80,160, 0.4)";

    // draw displacement
    ctx.strokeWeight = 1;

    let x = 0;
    let y = ENERGY_DEFAULT_HEIGHT;

    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 1; i <= N; i++) {
        x += dx;
        y = ENERGY_DEFAULT_HEIGHT - (val[i] * val[i]) * 0.2;
        ctx.lineTo(x, y);
        ctx.moveTo(x, y);
    }
    ctx.stroke();
}

/**
 * draw values as red (positive) and blue (negative) on a ring
 */
function draw_ring () {
    const maxAmplitude = Math.max(Math.max(...val), -Math.min(...val), 30);

    for (let i = 0; i < N; i++) {
        let col = 0.9 * val[i] / maxAmplitude;
        if (col >= 0) {
            ctx.fillStyle = `rgba(255,0,0, ${col})`;
        }
        else {
            ctx.fillStyle = `rgba(0,0,255, ${-col})`;
        }
        let a = TWO_PI * i / N;
        let xpos = RING_RADIUS * Math.cos(a);
        let ypos = RING_RADIUS * Math.sin(a);
        ctx.beginPath();
        ctx.arc(RING_CENTER_X + xpos, RING_CENTER_Y + ypos, 2, 0,TWO_PI);
        ctx.fill();
    }
    
    // draw boundary
    ctx.strokeStyle = "black";
    ctx.strokeWeight = 2;
    ctx.beginPath();
    ctx.moveTo(RING_CENTER_X + RING_RADIUS - 15, RING_CENTER_Y);
    ctx.lineTo(RING_CENTER_X + RING_RADIUS + 15, RING_CENTER_Y);
    ctx.stroke();
}
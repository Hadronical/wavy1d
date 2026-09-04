import { setup, update } from "./webgpu.js";

const cnv = document.getElementById('mainCanvas');
const ctx = cnv.getContext('2d');
const W = cnv.width;
const H = cnv.height;

const PI = Math.PI;
const TWO_PI = 2 * PI;
const HALF_PI = PI / 2;
export const dt = 0.005;
export const iterations = 4;

export const k = 500.0;
export const N = 800;
export let dx = W / N;
export let val = new Array(N).fill(0.0);
export let vel = new Array(N).fill(0.0);


//===== setup =====//
function index_to_space (i) {
    return 2 * (i / N) - 1;
}
function space_to_index (x) {
    return Math.round(0.5 * (x + 1) * N);
}
function initial_function (medium, domain_m,domain_M, func) {
    let m = space_to_index(domain_m);
    let M = space_to_index(domain_M);

    for (let i = m; i < M; i++) {
        medium[i] += func(index_to_space(i));
    }
}
function remap_domain(x, dom1, dom2) {
    let t = (x - dom1[0]) / (dom1[1] - dom1[0]);
    return dom2[0] + t * (dom2[1] - dom2[0]);
}


// set initial conditions
initial_function(val, -1,1, x => { x -= 0.5; return  30 * Math.exp( -((10 * x) ** 2) ) * Math.sin(15 * x * TWO_PI); });
//initial_function(-1,1, x => { x += 0.5; return  20 * Math.exp( -((8 * x) ** 2) ) * Math.sin(30 * x * TWO_PI); });
//initial_function(val, -1,1, x => { return 30 * Math.sin(16 * x * HALF_PI); });

setup(val, vel);

async function draw () {
    const result = await update(val, vel);

    val = result.val;
    vel = result.vel;

    ctx.fillStyle = 'rgb(20,20,20)';
    ctx.fillRect(0,0, W,H);

    draw_bounded();
    draw_ring();

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);



function draw_bounded() {
    ctx.strokeStyle = 'white';
    ctx.strokeWeight = 1;
    ctx.beginPath();
    ctx.moveTo(0, H/2);
    for (let i = 1; i < N; i++) {
        ctx.lineTo(dx * i, H/2 - val[i]);
        ctx.moveTo(dx * i, H/2 - val[i]);
    }
    ctx.stroke();
}
function draw_ring() {
    for (let i = 0; i < N; i++) {
        let col = val[i] / 40;
        if (col >= 0) {
            ctx.fillStyle = `rgba(255,0,0, ${col})`;
        }
        else {
            ctx.fillStyle = `rgba(0,0,255, ${-col})`;
        }
        let a = TWO_PI * i / N;
        let xpos = 120 * Math.cos(a);
        let ypos = 120 * Math.sin(a);
        ctx.beginPath();
        ctx.arc(W/2 + xpos, H/2 + ypos, 2, 0,TWO_PI);
        ctx.fill();
    }
}


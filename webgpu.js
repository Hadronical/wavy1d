import * as main from "./main.js";


//===== accessing WebGPU =====//

const ADAPTER = await navigator.gpu?.requestAdapter();
if (!ADAPTER) {
    throw Error("WebGPU not supported!");
}

const DEVICE = await ADAPTER?.requestDevice();


//===== setting up program resources =====//

// creating compute shader module
const SHADER_FILES = {
    CLOSED: await fetch("shaders/closed.wgsl"),
    //FIXME: OPEN  : await fetch("shaders/open.wgsl"), // OUTDATED UPDATE PROCESS
    // FIXME: RING  : await fetch("shaders/ring.wgsl") // OUTDATED UPDATE PROCESS
};
const STR_COMPUTESHADER  = await SHADER_FILES.CLOSED.text();

const SHADERMODULE_COMPUTE = DEVICE.createShaderModule({
    label: "updating compute shader",
    code: STR_COMPUTESHADER,
});
const info_compile = await SHADERMODULE_COMPUTE.getCompilationInfo();
for (let message of info_compile.messages) {
    if (message.type === "error") {
        console.error(`Shader error at line ${message.lineNum}: ${message.message}`);
    }
}

// setup pipeline
const PIPELINE = DEVICE.createComputePipeline({
    label: "update pipeline",
    layout: "auto",
    compute: { module: SHADERMODULE_COMPUTE },
});

// quick and dirty globals... I'm lazy
let buf_constants;

let BUFFER_CONSTANTS,
    BUFFER_VAL_A, BUFFER_VEL_A;
let BUFFER_VAL_B, BUFFER_VEL_B;
let BUFFER_VAL_OUT, BUFFER_VEL_OUT;
let BIND_GROUP_AB, BIND_GROUP_BA;


/**
 * Declares all buffers with initial values and bindgroups
 */
export function setup () {
    buf_constants = new Float32Array([main.dt, main.k]);
    const buf_temp = new Float32Array(new Array(main.N).fill(0.0));

    // create and write to input buffers
    BUFFER_CONSTANTS = DEVICE.createBuffer({
        label: "constants buffer",
        size: 8, // 2 x 4 (float32)
        usage:GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    // initialize constants
    DEVICE.queue.writeBuffer(BUFFER_CONSTANTS, 0, buf_constants);

    // A B buffers for ping pong
    BUFFER_VAL_A = DEVICE.createBuffer({
        label: "values buffer A",
        size: buf_temp.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    BUFFER_VEL_A = DEVICE.createBuffer({
        label: "velocity buffer A",
        size: buf_temp.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    BUFFER_VAL_B = DEVICE.createBuffer({
        label: "values buffer B",
        size: buf_temp.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    BUFFER_VEL_B = DEVICE.createBuffer({
        label: "velocity buffer B",
        size: buf_temp.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // create output buffers
    BUFFER_VAL_OUT = DEVICE.createBuffer({
        label: "output values buffer",
        size: buf_temp.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    BUFFER_VEL_OUT = DEVICE.createBuffer({
        label: "output velocity buffer",
        size: buf_temp.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // create bind groups for ping pong
    BIND_GROUP_AB = DEVICE.createBindGroup({
        label: "bind group for A to B buffers",
        layout: PIPELINE.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: BUFFER_CONSTANTS } },

            { binding: 1, resource: { buffer: BUFFER_VAL_A } },
            { binding: 2, resource: { buffer: BUFFER_VEL_A } },
            { binding: 3, resource: { buffer: BUFFER_VAL_B } },
            { binding: 4, resource: { buffer: BUFFER_VEL_B } },
        ],
    });
    BIND_GROUP_BA = DEVICE.createBindGroup({
        label: "bind group for A to B buffers",
        layout: PIPELINE.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: BUFFER_CONSTANTS } },

            { binding: 1, resource: { buffer: BUFFER_VAL_B } },
            { binding: 2, resource: { buffer: BUFFER_VEL_B } },
            { binding: 3, resource: { buffer: BUFFER_VAL_A } },
            { binding: 4, resource: { buffer: BUFFER_VEL_A } },
        ],
    });
}

/**
 * Propagates simulation by interation time steps, takes in vals and vels since
 * can be modified between frames, outputs the new vals and vels
 * 
 * @param {Float[]} val 
 * @param {Float[]} vel 
 * @returns {{val: Float[], vel: Float[]}}
 */
export async function update (val, vel) {
    // initialize buffers for update
    let buf_val = new Float32Array(val);
    let buf_vel = new Float32Array(vel);
    DEVICE.queue.writeBuffer(BUFFER_VAL_A, 0, buf_val);
    DEVICE.queue.writeBuffer(BUFFER_VEL_A, 0, buf_vel);

    //===== creating command encoder =====//

    const COMMAND_ENCODER = DEVICE.createCommandEncoder({label: "update encoder"});
    const PASS = COMMAND_ENCODER.beginComputePass({label: "update pass"});
    PASS.setPipeline(PIPELINE);

    // ping pong A B buffers
    for (let k = 0; k < main.iterations; k++) {
        if (k % 2 == 0) {
            PASS.setBindGroup(0, BIND_GROUP_AB);
        }
        else {
            PASS.setBindGroup(0, BIND_GROUP_BA);
        }
        PASS.dispatchWorkgroups(main.N);
    }

    PASS.end();

    if (main.iterations % 2 == 0) {
        COMMAND_ENCODER.copyBufferToBuffer(BUFFER_VAL_A,0, BUFFER_VAL_OUT,0, BUFFER_VAL_OUT.size);
        COMMAND_ENCODER.copyBufferToBuffer(BUFFER_VEL_A,0, BUFFER_VEL_OUT,0, BUFFER_VEL_OUT.size);
    }
    else {
        COMMAND_ENCODER.copyBufferToBuffer(BUFFER_VAL_B,0, BUFFER_VAL_OUT,0, BUFFER_VAL_OUT.size);
        COMMAND_ENCODER.copyBufferToBuffer(BUFFER_VEL_B,0, BUFFER_VEL_OUT,0, BUFFER_VEL_OUT.size);
    }

    const COMMAND_BUFFER = COMMAND_ENCODER.finish();

    //===== compute =====//

    // compute
    DEVICE.queue.submit([COMMAND_BUFFER]);

    // retrieve values
    await BUFFER_VAL_OUT.mapAsync(GPUMapMode.READ);
    await BUFFER_VEL_OUT.mapAsync(GPUMapMode.READ);
    buf_val = new Float32Array(BUFFER_VAL_OUT.getMappedRange());
    buf_vel = new Float32Array(BUFFER_VEL_OUT.getMappedRange());

    // copy output to object since data becomes invalid once unmapped
    const result = {
        val: [...buf_val],
        vel: [...buf_vel]
    };

    // unmap buffers
    BUFFER_VAL_OUT.unmap();
    BUFFER_VEL_OUT.unmap();

    return result;
}

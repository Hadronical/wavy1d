struct constants {
    dt: f32,
    k:  f32,
};
@group(0) @binding(0) var<uniform> CONSTANTS: constants;

@group(0) @binding(1) var<storage, read_write> buf_curr_val: array<f32>;
@group(0) @binding(2) var<storage, read_write> buf_curr_vel: array<f32>;
@group(0) @binding(3) var<storage, read_write> buf_next_val: array<f32>;
@group(0) @binding(4) var<storage, read_write> buf_next_vel: array<f32>;

@compute @workgroup_size(256)
fn update(@builtin(global_invocation_id) id: vec3u)
{
    let i = id.x;
    let endi = arrayLength(&buf_curr_val) - 1u;
    var acc: f32 = 0.0;

    // left acc
    if (i == 0) {
        acc += accelerate_from_to(buf_curr_val[i], buf_curr_val[endi]);
    }
    else {
        acc += accelerate_from_to(buf_curr_val[i], buf_curr_val[i - 1]);
    }

    // right acc
    if (i == endi) {
        acc += accelerate_from_to(buf_curr_val[i], buf_curr_val[0]);
    }
    else {
        acc += accelerate_from_to(buf_curr_val[i], buf_curr_val[i + 1]);
    }

    // update next vel
    buf_next_vel[i] = buf_curr_vel[i] + acc * CONSTANTS.dt;
    // update next val
    buf_next_val[i] = buf_curr_val[i] + buf_next_vel[i] * CONSTANTS.dt;
}
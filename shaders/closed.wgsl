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
fn update (@builtin(global_invocation_id) id: vec3u)
{
    let i = id.x;

    if (i == 0 || i == arrayLength(&buf_curr_val) - 1u) {
        // closed dirichlet conditions
        buf_next_val[i] = 0.0;
    }
    else {
        // calculate acc
        var acc: f32 = 0.0;
        // accumulate left acc
        acc += accelerate_from_to(buf_curr_val[i], buf_curr_val[i - 1]);
        // accumulate right acc
        acc += accelerate_from_to(buf_curr_val[i], buf_curr_val[i + 1]);
        // accumulate acc based on velocity
        acc += accelerate_by_velocity(buf_curr_vel[i]);

        // update next vel
        buf_next_vel[i] = buf_curr_vel[i] + acc * CONSTANTS.dt;
        // update next val
        buf_next_val[i] = buf_curr_val[i] + buf_next_vel[i] * CONSTANTS.dt;
    }
}

fn accelerate_from_to (v1: f32, v2: f32) -> f32 {
    // a = -k * x
    return -CONSTANTS.k * (v1 - v2);
}

fn accelerate_by_velocity (v: f32) -> f32 {
    return 0.0;
}
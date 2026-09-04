struct constants {
    dt : f32,
    k  : f32,
};
@group(0) @binding(0) var<uniform> CONSTANTS : constants;

@group(0) @binding(1) var<storage, read_write> buf_current : array<f32>;
@group(0) @binding(2) var<storage, read_write> buf_vel     : array<f32>;
@group(0) @binding(3) var<storage, read_write> buf_next    : array<f32>;

@compute @workgroup_size(100)
fn update (@builtin(global_invocation_id) id : vec3u)
{
    let i = id.x;
    let endi = arrayLength(&buf_current) - 1u;
    var acc : f32 = 0.0;

    // left acc
    if (i == 0) {
        acc += accelerate_from_to(buf_current[i], buf_current[endi]);
    }
    else {
        acc += accelerate_from_to(buf_current[i], buf_current[i - 1]);
    }

    // right acc
    if (i == endi) {
        acc += accelerate_from_to(buf_current[i], buf_current[0]);
    }
    else {
        acc += accelerate_from_to(buf_current[i], buf_current[i + 1]);
    }

    // update next buffer
    buf_vel[i] += acc * CONSTANTS.dt;
    buf_next[i] = buf_current[i] + buf_vel[i] * CONSTANTS.dt;
}

fn accelerate_from_to(p1 : f32, p2 : f32) -> f32 {
    return -CONSTANTS.k * (p1 - p2);
}

# Wavy1D

This is intended as a solver for the 1D wave equation given Dirichlet and initial conditions. Uses FEM with Euler integration, implemented with WebGPU compute shaders in WGSL, running on a simple JS animation loop. Program writes/reads values to/from GPU buffers on each frame and draws appropriately on a 2D canvas. Initial values and velocities are currently hardcoded.

Program uses a ping-pong algorithm to iterate through multiple time steps per frame entirely on the GPU side to allow smaller time steps and higher accuracy.

## Visuals

Central line represents the values at each point as a height, same with colors on the circle behind: red for positive; blue for negative.

## WIP

- Working on dynamically setting (initial) values and velocities through GUI.
- Visualizations for velocity and "energy".
- Updating all compute shaders so other Dirichlet conditions work with new ping-pong algorithm.

## Potential features

- Simulation could technically be outfitted for any ODE, even nonlinear, though the actual diff eq is currently hardcoded.
- Refactor code to use Float64 instead of Float32 for higher precision.
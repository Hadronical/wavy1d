# Wavy1D

See the program hosted on github pages at: https://hadronical.github.io/wavy1d/

The main project was intended as a solver for the 1D wave equation given initial positions and velocities. It uses FEM with Euler integration, implemented with WebGPU compute shaders in WGSL, running on a simple JS animation loop. Program writes/reads values to/from GPU buffers on each frame and draws appropriately on a 2D canvas.

Program uses a ping-pong algorithm to iterate through multiple time steps per frame entirely on the GPU side to allow smaller time steps and higher accuracy.

## Visuals

Central line represents the values at each point as a height, same with colors on the circle behind: red for positive; blue for negative.

## Usage

Use the configurator below the canvas to set initial conditions, and see what happens in the simulation!

You can specify initial positions F0: [-1,1] -> R by writing individual functions f_i: [min, max] -> R defined through JavaScript, yes it uses eval :(...

Or you can also specify initial velocity V0: [-1,1] -> R the same way.

The program currently imposes Dirichlet conditions of 0 on the boundaries.

## WIP

- Visualizations for velocity and "energy".
- Updating all compute shaders so other Dirichlet and Neumann conditions work with ping-pong algorithm.

## Potential features

- Simulation could technically be outfitted for any ODE, even nonlinear, though the actual diff eq is currently hardcoded.
- Refactor code to use Float64 instead of Float32 for higher precision.
# Wavy1D

See the program hosted on github pages at: https://hadronical.github.io/wavy1d/

The main project was intended as a solver for the 1D wave equation given initial positions and velocities. It uses FEM with Euler integration, implemented with WebGPU compute shaders in WGSL, running on a simple JS animation loop. Program writes/reads values to/from GPU buffers on each frame and draws appropriately on a 2D canvas.

Program uses a ping-pong algorithm to iterate through multiple time steps per frame entirely on the GPU side to allow smaller time steps and higher accuracy.

## Visuals

Black line represents the displacement at each point as a height. Same with colors on the circle behind: red for positive; blue for negative. Boundaries are marked with a perpendicular line.

## Usage

Use the configurator below the canvas to set initial conditions, and see what happens in the simulation!

### Initial Values

You can specify initial displacement $`F_0: [-1,1] \to \mathbb R`$ by writing individual functions $`f_i: [a, b] \to \mathbb R`$ defined as a JavaScript anonymous function body and specifying $a,b$ ... yes it uses eval :(

e.g. if the desired $`F_0(x) = e^{-x^2}`$ the equivalent JS anonymous, or arrow, function would be:
```
x => Math.exp(-(x**2))
or
x => { return Math.exp(-(x**2)); }
```
but you only need to input
```
"Math.exp(-(x**2))"
or
"{ return Math.exp(-(x**2)); }"
```

You can also specify initial velocity $`V_0: [-1,1] \to \mathbb R`$ the same way by choosing the appropriate option.

The program currently imposes Dirichlet conditions of 0 on the boundaries. There are some pre-defined constants for your benefit:
```
const TWO_PI  = 2 * Math.PI;
const PI      = Math.PI;
const HALF_PI = Math.PI / 2;
```


## WIP

- Update all compute shaders so other Dirichlet and Neumann conditions work with ping-pong algorithm.

## Potential features

- Simulation could technically be outfitted for any ODE, even nonlinear, though the actual diff eq is currently hardcoded.
- Refactor code to use Float64 instead of Float32 for higher precision.
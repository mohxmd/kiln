<p align="center">
  <img src="assets/logo.png" width="128" height="128" alt="Kiln" />
</p>

# Kiln

Compile modern web applications into self-contained native executables.

**Documentation:** [kiln.mohx.art](https://kiln.mohx.art)

For package usage and CLI details, see the [package guide](packages/kiln/README.md).

## Install

```bash
bun add -d kiln-compiler
```

## Usage

```bash
bun run build
kiln -o ./bin/app
./bin/app
```

Kiln packages the production build into a single deployable executable.

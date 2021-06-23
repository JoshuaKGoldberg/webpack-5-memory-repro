# Webpack 5 Memory Repro

Reproduction repository for seeing Webpack 5 take up large amounts of RAM for a project.

```shell
yarn
yarn prebuild
```

This code is reduced and simplified from a more complex setup.

Webpack 4 and 5 versions of scripts are in `script4` and `script5`, respectively.

## Usage

Memory tables generated after running `yarn start` locally, opening Activity Monitor, and waiting 2-3 minutes for the top `node` process to stop changing memory:

### Webpack 4

Setup:

```shell
cp package4.json package.json
rm -rf public
yarn
```

Each run:

```shell
yarn start
```

Each time, memory grew towards the peak, then decreased back down towards the stable.


| Run | Stable  | Peak    |
| --- | ------- | ------- |
| 1   | 1.04 GB | 2.49 GB |
| 2   | 1.08 GB | 2.29 GB |
| 3   | 1.07 GB | 2.37 GB |


### Webpack 5

```shell
cp package5.json package.json
rm -rf public
yarn
```

Each run:

```shell
yarn start
```

These are runs from different settings under `cache` in `app.config.js`.

#### cache: 'filesystem'

Each run grew towards 20 MB more than the stable amount then dipped down slightly.

| Run | Stable  |
| --- | ------- |
| 1   | 1.65 GB |
| 2   | 471 MB  |
| 3   | 471 MB  |

#### cache: true ('memory')

Each time, memory grew towards the peak, then decreased back down towards the stable.

| Run | Stable  | Peak    |
| --- | ------- | ------- |
| 1   | 1.18 GB | 1.84 GB |
| 2   | 1.27 GB | 1.84 GB |
| 3   | 1.25 GB | 1.84 GB |

#### cache: false

Each time, memory grew towards the peak, then decreased back down towards the stable.

| Run | Stable  | Peak    |
| --- | ------- | ------- |
| 1   | 1.38 GB | 1.84 GB |
| 2   | 1.39 GB | 1.88 GB |
| 3   | 1.26 GB | 1.84 GB |

## System Information

- macOS Big Sur
- Version 11.3.1
- Macbook Pro (16-inch, 2019)
- Processor: 2.6 GHz 6-core Intel Core i7
- Memory: 16 GB 2667 MHz DDR4

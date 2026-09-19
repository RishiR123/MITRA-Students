# Module 1 — ANN Regression

A neural network that predicts a number. One neuron, one straight line, and the
training loop that every larger network is built from.

## Watch

> **The video isn't linked yet.** Drop the YouTube link in and this section becomes a
> clickable thumbnail here, and a real embedded player on the
> [course site](https://rishir123.github.io/MITRA-Students/).

## Read

**[1.1 — ANN Regression](1.1-ann-regression.md)** — the four pieces every trained
network needs, what each line of the training loop does, and why `zero_grad()` is not
optional. Written to stand on its own if you'd rather read than watch.

## Run

| File | What it is |
|---|---|
| [`ann-regression.ipynb`](ann-regression.ipynb) | The notebook from the video |
| [`Student_Performance.csv`](Student_Performance.csv) | 10,000 rows of student data |

```bash
pip install torch pandas
jupyter notebook ann-regression.ipynb
```

The notebook finds the CSV next to itself, so it runs straight from this folder. On
Colab, upload `Student_Performance.csv` first and it picks it up from `/content/`.

## Build

Train the notebook on a feature that actually carries signal — `Previous Scores` →
`Performance Index` — print the loss as it falls, then swap in a hidden layer without
changing the training loop. Full brief at the bottom of the
[notes](1.1-ann-regression.md#your-turn).

Submit it under `submissions/cohort-2026/<your-username>/module-1/`, following
[CONTRIBUTING.md](../../CONTRIBUTING.md).

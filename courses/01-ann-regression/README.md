# Module 1 — ANN Regression

A neural network that predicts a number. One neuron, one straight line, and the
training loop that every larger network is built from.

## Watch

[![ANN Regression — training one neuron in PyTorch](https://i.ytimg.com/vi/5dN0udYRE9U/maxresdefault.jpg)](https://youtu.be/5dN0udYRE9U)

**[ANN Regression — training one neuron in PyTorch](https://youtu.be/5dN0udYRE9U)** · 24:14

GitHub strips `<iframe>` out of Markdown, so the image above opens the video on YouTube.
For a player embedded in the page, watch it on the
[course site](https://rishir123.github.io/MITRA-Students/#/module-1/1.1) — the notes,
the notebook and your progress sit alongside it there.

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

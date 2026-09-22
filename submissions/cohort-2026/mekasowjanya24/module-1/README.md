# Module 1 — ANN Regression

Trained a small neural network in PyTorch to predict `Performance Index` from 
`Previous Scores` (switched from the starter's `Sleep Hours` → `Hours Studied` 
pair, since that had almost no correlation).

## What I did
- Picked a feature/target pair with real signal (Previous Scores → Performance Index)
- Added loss printing every 100 epochs to watch training progress
- Replaced the single neuron (`nn.Linear(1,1)`) with a hidden layer: 
  `Linear(1,8) → ReLU → Linear(8,1)`, without changing the training loop

## What I learned / struggled with
- Understanding why the original feature pair didn't train well (no correlation)
- How `nn.Sequential` changes how you access weights/biases 
  (`named_parameters()` instead of `model.weight`)

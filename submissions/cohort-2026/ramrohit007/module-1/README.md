# Module 1 — <ANN Linear regression>

<!--
  Every module folder needs a README like this one. CI checks it exists; a mentor
  checks it's useful. Delete these comments before submitting.
-->

## What this is

This module implements a simple linear regression model using PyTorch. It uses Sleep Hours as the input and Hours Studied as the output, then trains a nn.Linear(1,1) model using Mean Squared Error loss and Stochastic Gradient Descent.

## How to run it

Make sure Python, pandas, and PyTorch are installed.

pip install pandas torch

Place Student_Performance.csv in the expected location and run:

python ANNLN.py

## What I learned

I learned how a PyTorch linear model can learn a relationship between an input and an output through training. I also understood the basic training process: make a prediction, calculate the error using MSE, clear the previous gradients, perform backpropagation, and update the model parameters using SGD.

## What I struggled with

I initially found it difficult to understand how the data needs to be converted into PyTorch tensors and reshaped before being passed to the model. I also had to understand why zero_grad(), backward(), and step() are needed in every training iteration.

## Sources

https://rishir123.github.io/MITRA-Students/#/module-1/1.1
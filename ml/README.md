# ML Module

This module contains training and scoring code for CyberShield Nexus.

## Structure
- `data/` raw, processed, and feature datasets
- `models/` serialized model artifacts
- `src/train.py` training pipeline entry point
- `src/score.py` scoring pipeline entry point

## Next implementation steps
1. Build feature engineering from `incidents` table snapshots.
2. Train risk classification model.
3. Persist model metadata and metrics into backend `model_registry`.
4. Expose scoring output to backend risk APIs.

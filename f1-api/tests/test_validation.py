import os
import pathlib
import pytest
import importlib.util
import sys

# Load the real conftest module from the same directory as this test file
conftest_path = pathlib.Path(__file__).parent / 'conftest.py'
spec = importlib.util.spec_from_file_location('conftest', conftest_path)
conftest_mod = importlib.util.module_from_spec(spec)
sys.modules['conftest'] = conftest_mod
spec.loader.exec_module(conftest_mod)

def test_candidate_nonexistent(tmp_path):
    """Candidate does not exist – should pass without error."""
    candidate = tmp_path / "new.db"
    conftest_mod._validate_temp_db(candidate)

def test_candidate_preexisting(tmp_path):
    """Candidate already exists – validator must reject."""
    candidate = tmp_path / "exists.db"
    candidate.touch()
    with pytest.raises(RuntimeError, match="already exists"):
        conftest_mod._validate_temp_db(candidate)

def test_candidate_symlink(tmp_path):
    """Candidate is a symbolic link – should be rejected."""
    target = tmp_path / "real.db"
    target.touch()
    symlink = tmp_path / "link.db"
    symlink.symlink_to(target)
    with pytest.raises(RuntimeError, match="symbolic link"):
        conftest_mod._validate_temp_db(symlink)

def test_collision_with_protected(monkeypatch, tmp_path):
    """Candidate collides with a protected path after normalization."""
    protected = tmp_path / "protected.db"
    protected.touch()
    # Patch the protected set used by the validator
    monkeypatch.setattr(conftest_mod, "PROTECTED_PATHS", {protected})
    with pytest.raises(RuntimeError, match="collides with protected path"):
        conftest_mod._validate_temp_db(protected)

def test_hardlink_detection(monkeypatch, tmp_path):
    """Candidate is a hard‑link to a protected file – validator raises for pre‑existence.

    Note: detecting a hard‑link when the candidate does *not* exist is not possible safely.
    """
    protected = tmp_path / "protected.db"
    protected.touch()
    monkeypatch.setattr(conftest_mod, "PROTECTED_PATHS", {protected})
    candidate = tmp_path / "hardlink.db"
    os.link(protected, candidate)
    # The validator will raise because the candidate already exists before the hard‑link check.
    with pytest.raises(RuntimeError, match="already exists"):
        conftest_mod._validate_temp_db(candidate)

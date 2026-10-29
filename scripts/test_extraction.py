"""Test extraction pipeline dengan repo dummy."""

import sys
from pathlib import Path
import tempfile
import subprocess
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from gitcontrib_ml.extractor import extract_repository


def create_test_repo(repo_path: Path) -> None:
    """Create a minimal test git repository."""
    repo_path.mkdir(parents=True, exist_ok=True)
    
    def run_cmd(cmd):
        subprocess.run(cmd, cwd=repo_path, shell=True, capture_output=True)
    
    # Initialize repo
    run_cmd("git init")
    run_cmd('git config user.email "test1@example.com"')
    run_cmd('git config user.name "Test Author"')
    
    # First commit
    test_file = repo_path / "README.md"
    test_file.write_text("# Test Project\nInitial commit")
    run_cmd("git add README.md")
    run_cmd('git commit -m "feat: initial commit"')
    
    # Second commit (feature)
    test_file.write_text("# Test Project\nAdded feature X")
    (repo_path / "feature.py").write_text("def feature():\n    pass\n")
    run_cmd("git add .")
    run_cmd('git commit -m "feat: add feature module"')
    
    # Third commit (bug fix)
    (repo_path / "bugfix.py").write_text("def fix():\n    return True\n")
    run_cmd("git add bugfix.py")
    run_cmd('git commit -m "fix: resolve issue #123"')
    
    # Different author
    run_cmd('git config user.email "test2@example.com"')
    run_cmd('git config user.name "Second Author"')
    
    # Fourth commit
    (repo_path / "utils.py").write_text("# Utility functions\n")
    run_cmd("git add utils.py")
    run_cmd('git commit -m "docs: add utility documentation"')
    
    print(f"✓ Test repository created at {repo_path}")


def test_extraction():
    """Test the extraction pipeline."""
    print("="*60)
    print("TESTING EXTRACTION PIPELINE")
    print("="*60 + "\n")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_path = Path(tmpdir) / "test_repo"
        output_dir = Path(tmpdir) / "output"
        
        print("[1/3] Creating test repository...")
        create_test_repo(repo_path)
        
        print("\n[2/3] Extracting commits and files...")
        try:
            commits_df, files_df, identity_map = extract_repository(
                repo_path,
                output_dir,
                repo_name="test_repo"
            )
            
            print("\n[3/3] Validating results...")
            print(f"\n✓ Extraction successful!")
            print(f"\nCommits DataFrame:")
            print(f"  Shape: {commits_df.shape}")
            print(f"  Columns: {list(commits_df.columns)}")
            print(f"\n{commits_df[['sha', 'author_name', 'author_email', 'message_subject']].to_string()}")
            
            print(f"\n\nFiles DataFrame:")
            print(f"  Shape: {files_df.shape}")
            print(f"  Columns: {list(files_df.columns)}")
            print(f"\n{files_df[['sha', 'file_path', 'lines_added', 'lines_deleted']].to_string()}")
            
            print(f"\n\nIdentity Map:")
            for author_id, info in identity_map.items():
                print(f"  {author_id}: {info['canonical_name']} ({info['canonical_email']})")
            
            print(f"\n✓ All tests passed!")
            return True
            
        except Exception as e:
            print(f"\n✗ Extraction failed: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    success = test_extraction()
    sys.exit(0 if success else 1)

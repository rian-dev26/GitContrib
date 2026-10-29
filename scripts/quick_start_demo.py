"""Quick start guide untuk training dan prediksi."""

import sys
from pathlib import Path
import tempfile
import subprocess
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from gitcontrib_ml.extractor import extract_repository
from gitcontrib_ml.features import build_contributor_features, build_commit_features
from gitcontrib_ml.models import train_clustering_model, train_commit_type_model
from gitcontrib_ml.labeling import auto_label_commits


def create_demo_repo(repo_path: Path) -> None:
    """Create demo repo dengan banyak commits."""
    repo_path.mkdir(parents=True, exist_ok=True)
    
    def run_cmd(cmd):
        result = subprocess.run(cmd, cwd=repo_path, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Warning: {result.stderr}")
    
    run_cmd("git init")
    run_cmd('git config user.email "alice@example.com"')
    run_cmd('git config user.name "Alice Developer"')
    
    # Create multiple commits by different authors
    authors = [
        ("alice@example.com", "Alice Developer"),
        ("bob@example.com", "Bob Contributor"),
        ("charlie@example.com", "Charlie Tester"),
    ]
    
    for i in range(20):
        author_email, author_name = authors[i % 3]
        run_cmd(f'git config user.email "{author_email}"')
        run_cmd(f'git config user.name "{author_name}"')
        
        file_path = repo_path / f"file_{i}.py"
        
        # Vary commit types
        if i % 5 == 0:
            msg = f"feat: add feature {i}"
            file_path.write_text(f"# Feature {i}\ndef feature_{i}():\n    pass\n" * (i+1))
        elif i % 5 == 1:
            msg = f"fix: resolve bug {i}"
            file_path.write_text(f"# Fix {i}\ndef fix_{i}():\n    return True\n")
        elif i % 5 == 2:
            msg = f"docs: update documentation {i}"
            file_path.write_text(f"# Documentation {i}\n")
        else:
            msg = f"refactor: cleanup code {i}"
            file_path.write_text(f"# Refactored code {i}\ndef refactor_{i}():\n    pass\n")
        
        run_cmd(f"git add file_{i}.py")
        run_cmd(f'git commit -m "{msg}"')
    
    print(f"✓ Demo repo created: {repo_path}")


def quick_start_demo():
    """End-to-end demo: extract -> features -> train -> predict."""
    print("="*70)
    print("GITCONTRIB ML - QUICK START DEMO")
    print("="*70)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        repo_path = tmpdir / "demo_repo"
        data_dir = tmpdir / "data"
        models_dir = tmpdir / "models"
        
        # Step 1: Create demo repo
        print("\n[Step 1/5] Creating demo repository with 20 commits...")
        create_demo_repo(repo_path)
        
        # Step 2: Extract data
        print("\n[Step 2/5] Extracting data from repository...")
        commits_df, files_df, identity_map = extract_repository(
            repo_path, data_dir, "demo_repo", limit=50
        )
        
        print(f"  ✓ Extracted {len(commits_df)} commits from {len(identity_map)} authors")
        
        # Step 3: Build features
        print("\n[Step 3/5] Building features for clustering and classification...")
        
        contrib_features = build_contributor_features(commits_df, files_df)
        print(f"  ✓ Contributor features: {contrib_features.shape}")
        
        commit_features = build_commit_features(commits_df, files_df)
        print(f"  ✓ Commit features: {commit_features.shape}")
        
        # Step 4: Auto-label commits
        print("\n[Step 4/5] Auto-labeling commits...")
        label_stats = auto_label_commits(commits_df)
        print(f"  ✓ Labeled {label_stats['labeled']}/{label_stats['total']} commits")
        print(f"    Distribution: {label_stats['distribution']}")
        
        # Step 5: Train models
        print("\n[Step 5/5] Training ML models...")
        
        models_dir.mkdir(parents=True, exist_ok=True)
        
        print("\n  Training clustering model...")
        cluster_meta = train_clustering_model(contrib_features, models_dir, k_range=range(2, 5))
        
        print("\n  Training commit classifier...")
        commit_meta = train_commit_type_model(commits_df, models_dir)
        
        # Display results
        print("\n" + "="*70)
        print("✓ DEMO COMPLETED SUCCESSFULLY")
        print("="*70)
        
        print("\n[CLUSTERING RESULTS]")
        print(f"  Clusters: {cluster_meta['n_clusters']}")
        print(f"  Silhouette Score: {cluster_meta['silhouette_score']:.4f}")
        print(f"  Distribution: {cluster_meta['cluster_distribution']}")
        
        print("\n[CLASSIFICATION RESULTS]")
        print(f"  Classes: {commit_meta['classes']}")
        print(f"  CV Mean F1: {commit_meta['cv_mean_f1']:.4f}")
        
        print(f"\n[CONTRIBUTOR ANALYSIS]")
        print(contrib_features[["author_id", "total_commits", "active_days", "total_lines_changed"]].to_string())
        
        print(f"\n[MODELS SAVED TO]")
        print(f"  {models_dir}")
        
        return True


if __name__ == "__main__":
    try:
        success = quick_start_demo()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Demo failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

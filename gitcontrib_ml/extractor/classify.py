"""File and author classification utilities."""


def classify_file(file_path: str) -> str:
    """Classify file into category: code, test, doc, config, or other."""
    path_lower = file_path.lower()
    
    # Test files
    if any(x in path_lower for x in ["/test/", "/tests/", "_test.", ".test.", 
                                      "/spec/", "/__tests__/", "_spec."]):
        return "test"
    
    # Documentation
    if any(path_lower.endswith(x) for x in [".md", ".rst", ".txt", ".adoc"]):
        return "doc"
    if any(x in path_lower for x in ["/docs/", "/doc/", "/documentation/"]):
        return "doc"
    
    # Config
    if any(path_lower.endswith(x) for x in [
        ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
        ".gradle", ".maven", ".xml", "dockerfile", ".dockerignore",
        ".gitignore", ".gitattributes", ".env", "makefile"
    ]):
        return "config"
    if any(x in path_lower for x in ["/config/", "/.github/", "/k8s/"]):
        return "config"
    
    # Code
    code_extensions = [
        ".py", ".js", ".ts", ".java", ".cpp", ".c", ".cs", ".go", ".rs",
        ".rb", ".php", ".swift", ".kt", ".scala", ".lua", ".r", ".sh",
        ".vue", ".tsx", ".jsx", ".html", ".css", ".scss", ".less"
    ]
    if any(path_lower.endswith(x) for x in code_extensions):
        return "code"
    
    return "other"


def is_bot_author(name: str, email: str) -> bool:
    """Detect bot/automated commits."""
    combined = (name + " " + email).lower()
    
    bot_patterns = [
        "dependabot", "github-actions", "renovate", "snyk", "codecov",
        "travis", "circleci", "github", "[bot]", "bot", "automation",
        "ci/cd", "jenkins", "gitlab-ci", "drone"
    ]
    
    return any(pattern in combined for pattern in bot_patterns)

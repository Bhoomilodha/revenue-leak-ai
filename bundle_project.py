import os

# Files to concatenate for the ChatGPT review
files_to_bundle = [
    "README.md",
    "DEMO.md",
    "backend/main.py",
    "backend/database.py",
    "backend/ai_engine.py",
    "backend/recovery_engine.py",
    "backend/test_recovery.py",
    "frontend/src/App.tsx",
    "frontend/src/pages/Home.tsx",
    "frontend/src/pages/Login.tsx",
    "frontend/src/pages/Dashboard.tsx",
    "frontend/src/components/RevenueFlow.tsx",
    "frontend/src/components/LeakMap.tsx",
    "frontend/src/components/RecoveryGraph.tsx",
    "frontend/src/components/PageTransition.tsx",
    "frontend/tailwind.config.js"
]

output_file = "project_codebase.md"

with open(output_file, "w", encoding="utf-8") as outfile:
    outfile.write("# RevenueLeak AI Consolidated Codebase\n\n")
    outfile.write("This document contains all source code and documentation files for the RevenueLeak AI application, generated for ChatGPT code review and analysis.\n\n")
    
    # Write File Tree
    outfile.write("## Folder Structure\n")
    outfile.write("```text\n")
    outfile.write("RevenueLeak AI/\n")
    outfile.write("├── README.md\n")
    outfile.write("├── DEMO.md\n")
    outfile.write("├── requirements.txt\n")
    outfile.write("├── bundle_project.py\n")
    outfile.write("├── backend/\n")
    outfile.write("│   ├── main.py\n")
    outfile.write("│   ├── database.py\n")
    outfile.write("│   ├── ai_engine.py\n")
    outfile.write("│   ├── recovery_engine.py\n")
    outfile.write("│   └── test_recovery.py\n")
    outfile.write("└── frontend/\n")
    outfile.write("    ├── index.html\n")
    outfile.write("    ├── package.json\n")
    outfile.write("    ├── tailwind.config.js\n")
    outfile.write("    └── src/\n")
    outfile.write("        ├── App.tsx\n")
    outfile.write("        ├── index.css\n")
    outfile.write("        ├── main.tsx\n")
    outfile.write("        ├── pages/\n")
    outfile.write("        │   ├── Home.tsx\n")
    outfile.write("        │   ├── Login.tsx\n")
    outfile.write("        │   └── Dashboard.tsx\n")
    outfile.write("        └── components/\n")
    outfile.write("            ├── RevenueFlow.tsx\n")
    outfile.write("            ├── LeakMap.tsx\n")
    outfile.write("            ├── RecoveryGraph.tsx\n")
    outfile.write("            └── PageTransition.tsx\n")
    outfile.write("```\n\n")
    
    for relative_path in files_to_bundle:
        if os.path.exists(relative_path):
            outfile.write(f"## File: `{relative_path}`\n")
            
            # File syntax highlighting selection
            ext = relative_path.split(".")[-1]
            if ext == "py":
                lang = "python"
            elif ext in ["tsx", "ts", "js"]:
                lang = "typescript" if ext in ["tsx", "ts"] else "javascript"
            elif ext == "md":
                lang = "markdown"
            else:
                lang = "text"
                
            outfile.write(f"```{lang}\n")
            with open(relative_path, "r", encoding="utf-8") as infile:
                outfile.write(infile.read())
            outfile.write("\n```\n\n")
            print(f"Bundled: {relative_path}")
        else:
            print(f"Skipping (not found): {relative_path}")

print(f"\nDone! Consolidated codebase saved to: {os.path.abspath(output_file)}")
print("You can upload this 'project_codebase.md' file directly into ChatGPT.")

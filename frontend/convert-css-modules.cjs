function updateImports(files, renamedFiles) {
  const importRegex = /import\s+(['"])(.+\.css)\1/g;

  files.forEach((file) => {
    if (!file.match(/\.(jsx?|tsx?)$/)) return;

    let content = fs.readFileSync(file, "utf-8");
    let changed = false;

    renamedFiles.forEach(({ old, new: newName }) => {
      // استبدال import بدون استخدام متغير (import './file.css')
      const regexImportOnly = new RegExp(
        `import\\s+(['"])\\.\\/(${old})\\1;?`,
        "g"
      );

      // استبدال import مع متغير (import styles from './file.css')
      const regexImportVar = new RegExp(
        `import\\s+(\\w+)\\s+from\\s+(['"])\\.\\/(${old})\\2;?`,
        "g"
      );

      if (regexImportOnly.test(content)) {
        content = content.replace(
          regexImportOnly,
          `import styles from './${newName}';`
        );
        changed = true;
      }
      if (regexImportVar.test(content)) {
        content = content.replace(
          regexImportVar,
          (match, varName, quote, filename) => {
            return `import ${varName} from './${newName}';`;
          }
        );
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(file, content, "utf-8");
      console.log(`🔄 Updated imports in: ${file}`);
    }
  });
}
const fs = require("fs");
const path = require("path");

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// 1. Rename .css to .module.css (skip if already .module.css)
function renameCssFiles(files) {
  const renamedFiles = [];
  files.forEach((file) => {
    if (file.endsWith(".css") && !file.endsWith(".module.css")) {
      const newPath = file.replace(/\.css$/, ".module.css");
      fs.renameSync(file, newPath);
      console.log(`✅ Renamed: ${file} → ${newPath}`);
      renamedFiles.push({
        old: path.basename(file),
        new: path.basename(newPath),
      });
    }
  });
  return renamedFiles;
}

// 2. Update CSS imports in JS/TS files
function updateImports(files, renamedFiles) {
  files.forEach((file) => {
    if (!file.match(/\.(jsx?|tsx?)$/)) return;

    let content = fs.readFileSync(file, "utf8");
    let changed = false;

    renamedFiles.forEach(({ old, new: newName }) => {
      const regex = new RegExp(`(['"])\\.\\/(${old})\\1`, "g");
      if (regex.test(content)) {
        content = content.replace(regex, `'./${newName}'`);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(file, content, "utf8");
      console.log(`🔄 Updated imports in: ${file}`);
    }
  });
}

// 3. Replace className="..." with className={styles["..."]} and add import if missing
function updateClassNamesAndImports(files) {
  files.forEach((file) => {
    if (!file.match(/\.(jsx?|tsx?)$/)) return;

    let content = fs.readFileSync(file, "utf8");
    let originalContent = content;

    // Replace className="class1 class2"
    const classNameRegex = /className\s*=\s*"([^"]+)"/g;

    content = content.replace(classNameRegex, (match, classNames) => {
      const classes = classNames.trim().split(/\s+/);
      const newClass = classes
        .map((cls) => `styles["${cls}"]`)
        .join(' + " " + ');
      return `className={${newClass}}`;
    });

    // Check if styles import exists
    const importRegex = /import\s+styles\s+from\s+['"].+\.module\.css['"]/;
    if (!importRegex.test(content)) {
      // Try to detect relative path for styles import based on file path
      // Assumption: style file has same base name as JS file with .module.css
      const fileDir = path.dirname(file);
      const baseName = path.basename(file, path.extname(file));
      let stylePath = `./${baseName}.module.css`;

      // Verify if the CSS module file exists, else don't add import
      if (fs.existsSync(path.join(fileDir, `${baseName}.module.css`))) {
        content = `import styles from '${stylePath}';\n` + content;
        console.log(`➕ Added styles import in: ${file}`);
      } else {
        // could not find matching css module, skip adding import
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(file, content, "utf8");
      console.log(`✨ Updated className in: ${file}`);
    }
  });
}

// تشغيل السكريبت
function run() {
  const allFiles = getAllFiles(process.cwd());

  const renamedCss = renameCssFiles(allFiles);
  updateImports(allFiles, renamedCss);
  updateClassNamesAndImports(allFiles);

  console.log("\n🎉 Done! All CSS files converted and classNames updated.");
}

run();

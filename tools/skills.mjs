import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const modules = Object.freeze(['experience', 'match', 'resume', 'interview']);
const defaultRoot = fileURLToPath(new URL('../skills/', import.meta.url));

function checkModule(module) {
  if (!modules.includes(module)) throw new Error('未知模块 ' + module + '。可用模块为 ' + modules.join(', '));
}

function readHeader(markdown, path) {
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
  const end = lines.indexOf('---', 1);
  if (lines[0] !== '---' || end < 1) throw new Error(path + ' 缺少 frontmatter');
  const values = {};
  for (let i = 1; i < end; i++) {
    const key = /^(name|description):\s*(.*?)\s*$/.exec(lines[i]);
    if (!key) continue;
    const field = key[1];
    if (field in values) throw new Error(path + ' 重复声明 ' + field);
    let value = key[2];
    if (/^[>|][-+]?$/.test(value)) {
      const parts = [];
      while (i+1 < end && /^\s/.test(lines[i+1])) parts.push(lines[++i].trim());
      value = parts.join(value.startsWith('|') ? '\n' : ' ');
    } else if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { throw new Error(path + ' 的 ' + field + ' 引号无效'); }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1,-1).replaceAll("''", "'");
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    values[field] = value.trim();
  }
  if (!values.name || !values.description) throw new Error(path + ' 需要非空的 name 和 description');
  return values;
}

function contained(base, path) {
  const fromBase = relative(base, path);
  return fromBase !== '..' && !fromBase.startsWith('..' + sep) && !isAbsolute(fromBase);
}

function packages(module, root) {
  checkModule(module);
  const folder = join(root, module);
  const seen = new Set();
  return readdirSync(folder, {withFileTypes:true})
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .sort((a,b) => a.name.localeCompare(b.name, 'en'))
    .map(entry => {
      const directory = join(folder, entry.name);
      const file = join(directory, 'SKILL.md');
      const realFile = realpathSync(file);
      if (!contained(realpathSync(directory), realFile)) throw new Error(file + ' 指向技能包外部');
      const content = readFileSync(file, 'utf8');
      const data = readHeader(content, file);
      if (seen.has(data.name)) throw new Error(module + ' 内的技能重名：' + data.name);
      seen.add(data.name);
      return {module, ...data, directory, file, content};
    });
}

/** Read directory metadata on each invocation so additions and replacements are visible. */
export function listSkills(module, root = defaultRoot) {
  const groups = module === undefined ? modules : [module];
  return groups.flatMap(group => packages(group, root).map(({content, ...info}) => info));
}

/** Repository code invokes this with the selected workbench and exact frontmatter name. */
export function loadSkill(module, name, root = defaultRoot) {
  const skill = packages(module, root).find(skill => skill.name === name);
  if (!skill) throw new Error(module + ' 中找不到技能 ' + name);
  return skill;
}

function markdownFiles(directory) {
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && /\.md$/i.test(entry.name) ? [path] : [];
  });
}

// Inline links/images and reference definitions use Markdown file-relative locations.
// Code samples, anchor IDs and arbitrary command arguments are outside this check.
function destinations(markdown) {
  let fence = null;
  const files = [];
  for (const line of markdown.split(/\r?\n/)) {
    const delimiter = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (delimiter && delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length) fence = null;
      continue;
    }
    if (delimiter) { fence = delimiter[1]; continue; }
    const text = line.replace(/(`+).*?\1/g, '');
    for (const match of text.matchAll(/\]\(\s*(?:<([^>]+)>|([^\s()]+))/g)) files.push(match[1] || match[2]);
    const def = /^ {0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/.exec(text);
    if (def) files.push(def[1] || def[2]);
  }
  return files;
}

function verifyReference(base, file, reference) {
  if (/^(https?:\/\/|mailto:|#)/i.test(reference)) return;
  const name = decodeURIComponent(reference.split(/[?#]/,1)[0]);
  if (!name) return;
  if (/^([a-z][\w+.-]*:|[\\/])/i.test(name)) throw new Error('需要包内相对路径');
  const path = resolve(dirname(file), name);
  if (!contained(base, path) || !contained(realpathSync(base), realpathSync(path))) throw new Error('引用越出技能目录');
  if (!statSync(path).isFile()) throw new Error('引用目标必须是文件');
}

export function checkSkills(root = defaultRoot) {
  const skills = listSkills(undefined, root);
  let checkedLinks = 0;
  for (const skill of skills) {
    for (const file of markdownFiles(skill.directory)) {
      for (const ref of destinations(readFileSync(file, 'utf8'))) {
        try { verifyReference(skill.directory, file, ref); } catch (err) {
          throw new Error(relative(root,file) + ' → ' + ref + '（' + err.message + '）');
        }
        checkedLinks++;
      }
    }
  }
  return {modules:modules.length, skills:skills.length, checkedLinks};
}

const usage = 'node tools/skills.mjs list [experience|match|resume|interview]\nnode tools/skills.mjs show <模块> <技能名>\nnode tools/skills.mjs check';
function main([command = 'list', ...args]) {
  if (command === '--help' || command === '-h') return console.log(usage);
  if (command === 'list' && args.length <= 1) {
    const skills = listSkills(args[0]);
    for (const module of args.length ? args : modules) {
      console.log(module);
      const names = skills.filter(skill => skill.module === module);
      if (!names.length) console.log('  （待添加）');
      for (const skill of names) console.log('  ' + skill.name + '  ' + skill.description);
    }
    return;
  }
  if (command === 'show' && args.length === 2) return process.stdout.write(loadSkill(...args).content);
  if (command === 'check' && !args.length) {
    const result = checkSkills();
    return console.log('通过：' + result.modules + ' 个模块，' + result.skills + ' 个技能包，' + result.checkedLinks + ' 个链接。');
  }
  throw new Error(usage);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { main(process.argv.slice(2)); } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

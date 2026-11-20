import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { modules, listSkills, loadSkill, checkSkills } from './skills.mjs';

function fixture(t) {
  const temp = realpathSync(tmpdir());
  const root = mkdtempSync(join(temp, 'career-folio-skills-'));
  t.after(() => {
    if (dirname(realpathSync(root)) === temp) rmSync(root, {recursive:true,force:true});
  });
  for (const module of modules) mkdirSync(join(root,module));
  function add(folder, name, body='', module='resume') {
    const directory = join(root,module,folder);
    mkdirSync(directory);
    writeFileSync(join(directory,'SKILL.md'),'---\nname: '+name+'\ndescription: >-\n  生成一份\n  简历\n---\n'+body);
    return directory;
  }
  return {root,add};
}

test('按模块发现、精确选择并重新加载包', t => {
  const f=fixture(t);
  f.add('folder-a','general');
  assert.deepEqual(listSkills('match',f.root),[]);
  assert.equal(loadSkill('resume','general',f.root).description,'生成一份 简历');
  f.add('folder-b','special');
  f.add('another','general','','interview');
  assert.equal(listSkills('resume',f.root).length,2);
  assert.throws(()=>loadSkill('resume','gen',f.root),/找不到/);
  assert.equal(checkSkills(f.root).skills,3);
  f.add('duplicate','general');
  assert.throws(()=>checkSkills(f.root),/重名/);
});

test('检查各级 Markdown 的图片、行内链接和链接定义', t=>{
  const f=fixture(t),dir=f.add('sample','sample','[规范](references/layout.md)\n![图][preview]\n[preview]: <sample image (1).png>\n`[示例](missing-input.json)`');
  mkdirSync(join(dir,'references'));
  writeFileSync(join(dir,'sample image (1).png'),'placeholder');
  writeFileSync(join(dir,'references','layout.md'),'[技能说明](../SKILL.md)');
  assert.equal(checkSkills(f.root).checkedLinks,3);
  writeFileSync(join(dir,'references','layout.md'),'[未提供的文件](missing.md)');
  assert.throws(()=>checkSkills(f.root),/missing\.md/);
  writeFileSync(join(dir,'references','layout.md'),'[外部文件](..%2F..%2F..%2Foutside.md)');
  assert.throws(()=>checkSkills(f.root),/越出技能目录/);
});

test('缺少必需元数据或模块时返回可读错误',t=>{
  const f=fixture(t),dir=f.add('tool','tool');
  writeFileSync(join(dir,'SKILL.md'),'---\nname: tool\n---\n');
  assert.throws(()=>listSkills('resume',f.root),/description/);
  assert.throws(()=>listSkills('unknown',f.root),/未知模块/);
});

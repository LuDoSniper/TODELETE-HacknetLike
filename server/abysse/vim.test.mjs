import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initVim,vimKey,previousWord} from '../../src/vim.mjs';
test('word deletion at cursor',()=>{assert.equal(previousWord('cat /tmp/foo',12),4);assert.equal(previousWord('cat hello ',10),4);assert.equal(previousWord('abc def ghi',7),4);});
test('modal editing, write and quit, undo and redo',()=>{const e=initVim({data:'alpha\nbeta',row:0,col:0,dirty:false});vimKey(e,'i');vimKey(e,'X');vimKey(e,'\x1b');assert.equal(e.data,'Xalpha\nbeta');vimKey(e,'u');assert.equal(e.data,'alpha\nbeta');vimKey(e,'\x12');assert.equal(e.data,'Xalpha\nbeta');vimKey(e,':');vimKey(e,'wq');assert.equal(vimKey(e,'\r'),'savequit');});
test('normal mode line operations and read-only protection',()=>{const e=initVim({data:'a\nb\nc',row:0,col:0,dirty:false});vimKey(e,'d');vimKey(e,'d');assert.equal(e.data,'b\nc');vimKey(e,'p');assert.equal(e.data,'b\na\nc');vimKey(e,':');vimKey(e,'q');assert.equal(vimKey(e,'\r'),undefined);assert.match(e.message,/E37/);e.readOnly=true;vimKey(e,'i');assert.equal(e.vimMode,'NORMAL');});

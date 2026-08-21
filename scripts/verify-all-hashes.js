const bcrypt = require('bcrypt');
function normalizeAnswer(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }

// Docker lab flags - what answer should be in ubuntu:22.04 container
const dockerFlags = [
  { title: 'File Creator', hash: '$2b$10$Mklnr/oabNywY956DeMlCeDX5fxeKfIWyPyBe46eLf168iF50MIay', candidates: ['i built this container'] },
  { title: 'Process Inspector', hash: '$2b$10$McsRZi4BdFLVQwQzTnLAqOhExzDwcVboeGLXKilLljgefr8zw8qhS', candidates: ['tail -f /dev/null', 'tail', 'tail -f', '/usr/bin/tail'] },
  { title: 'Date Formatter', hash: '$2b$10$xxhG52YOmFShSHmv90EgUuyTTehZvit2k5ZoQpIgPsBmkp2E7uBE.', candidates: ['20260820', '20260821'] },
  { title: 'File Duplicator', hash: '$2b$10$AsIdpR8x8i9q7epV7Q0sZ.94TvkrypXJ2F8PwRGppRNGl/JNalXSC', candidates: [''] },
  { title: 'Limits Reader', hash: '$2b$10$VCfCCuyx6yRfABA0W4qvuugTfRlZVjFg/1SBEPfjNCHyTL989eirO', candidates: ['1024'] },
  { title: 'Path Resolver', hash: '$2b$10$t9GqjmVw0C59xI4za91m9es2vFYD929wUzu6WSKD3dB5JECFjtMqq', candidates: ['/home/student', '/root'] },
  { title: 'String Length', hash: '$2b$10$E/U.4PftqlqLZhfMSXapMuQcD8A8pxYwUlThOUeJsbbilucHxQWyG', candidates: ['11'] },
  { title: 'Permission Setter', hash: '$2b$10$VwFkonnpA5xr7Bk3DxysjeLrLYz8LAY0L2oebDBC6LYtLyP7.yw2a', candidates: ['000', '0'] },
  { title: 'Multi-Line Writer', hash: '$2b$10$Zb5w9wghOw27PXIP8geZFu821nl3kvLY7Eauforuq4li0CMy1mObe', candidates: ['3'] },
  { title: 'Text Searcher', hash: '$2b$10$c4BNQdzF.vp/ptkHfhKkv.hM1BSq45pO7mOMXJy9XsOpyD0FIz896', candidates: ['2'] },
  { title: 'Sort Master', hash: '$2b$10$aM53ZEBSqyMLh4sc.VBXROUPeGHSfl.30.o/8t6P/gf.ZC/6Ovo56', candidates: ['alice'] },
  { title: 'Unique Counter', hash: '$2b$10$uEaMICqec2P/z9ZQ3yxVges5kySF46m1ppXCXfuZLSEXv0RPXaqXi', candidates: ['3'] },
  { title: 'Hex Converter', hash: '$2b$10$otUOlD.C.batkSuRNZxNzeFHUCQ1jw62EMuyp5sqrprJWCj2IjZta', candidates: ['ff'] },
  { title: 'Script Writer', hash: '$2b$10$dVAcFgE1U5NlqUSc8A8O6ezOpGM45JpZIwDw0pY5DlkuHIW67mvdO', candidates: ['container_ok'] },
  { title: 'Process Killer', hash: '$2b$10$3BQUGiigS73hJu1QcuUwFunWg8Zcdmj9A6oX2/3BoLTL7fSMcI8cy', candidates: ['0'] },
];

// Beginner lab flags that failed
const beginnerFlags = [
  { title: 'User Deleter', hash: '$2b$10$hYp.8q41aqJHqCyfObZo1.HCVOOGb3ByZCRaSUHrSEuDi0w.4/WOe', candidates: ['user', 'no such user'] },
  { title: 'Pipeline Master', hash: '$2b$10$5hjt33h4OsRNTxt0lfAWJuTXanGqJEyBBAKB929fqZJUkWyu4yToe', candidates: ['/bin/bash /bin/sync /usr/sbin/nologin', '/bin/bash /bin/sh /bin/sync', '/bin/bash /bin/sh /usr/sbin/nologin'] },
  { title: 'Passwd Field Parse', hash: '$2b$10$SIIwfFNDwBM4XTOmDHbuneC/Rz9bR.z/uq9yNZjz5C8FpCYB2v9Ke', candidates: ['nobody student', 'nobody', 'nobody games'] },
  { title: 'Script Writer (Text)', hash: '$2b$10$QjZ5ff/kRQpqs9lFA3KazeXnXfnRmjW4O0cZAaZKlWHRuBaaU/.LS', candidates: ['20', '22', '21'] },
  { title: 'Find World Writable', hash: '$2b$10$gztJunZ6BRaMEyBPrY0KDO0MrIIfyvS9qnl8INKf87h36WpC5lzFu', candidates: ['1', '0'] },
  { title: 'Group Manager', hash: '$2b$10$jnCmVtWkhFt/Gx0GInm3ou7xrGK6SqVcVm8S/./Woh8hWyZ.YDyQe', candidates: ['student : student admin_group', 'student admin_group'] },
  { title: 'Tar Packer', hash: '$2b$10$RJ9P/pL1GkWpUvzW8WqceuUlCoNDsXFzFIb2I00sOnZ88lbKF09Ey', candidates: ['3', '4'] },
  { title: 'Column Extractor', hash: '$2b$10$j0Oh4Oi1f/jNAxi99ej6VOEP/DQKO45qcLdo7it0YQc5MTgg/lTuu', candidates: ['alice charlie', 'alice'] },
  { title: 'Sort & Count', hash: '$2b$10$ZjizwoxpxdNwJ4uZfaPbbuSf./tXm4yUmhvfiR9pxjghkssK1XkaW', candidates: ['banana'] },
  { title: 'awk Architect', hash: '$2b$10$kS.vzjqOsJIE.ArDiXeBB.PvW2pmT7wZumSgIiysjuIaWbd1M7uga', candidates: ['root daemon bin', 'root nobody student'] },
  { title: 'Disk Space Expert', hash: '$2b$10$VVYrOP2QLwmAWBsrBazanuWxelm1LOeQM6ssi.1OYnLongAlxx/gG', candidates: ['/'] },
  { title: 'Pipe Composer', hash: '$2b$10$OWaZX.ygxD4VrTWLuOfmH.U3edG93HJJqLnXkKl05wyEGP/hGcSui', candidates: ['/bin/bash /bin/sync /usr/sbin/nologin'] },
  { title: 'Process Inspector (Lab1)', hash: '$2b$10$F19Rav5kqABOI5LKCBEPCOnLs6cL4xzvMuji9MTR8RIZlyL4q3AE6', candidates: ['tail', 'bash'] },
];

async function main() {
  console.log("=== DOCKER LAB ===");
  for (const f of dockerFlags) {
    let found = false;
    for (const c of f.candidates) {
      if (await bcrypt.compare(normalizeAnswer(c), f.hash)) {
        console.log(`PASS: ${f.title} = "${c}"`);
        found = true;
        break;
      }
    }
    if (!found) console.log(`FAIL: ${f.title} - tried [${f.candidates.join(', ')}]`);
  }
  
  console.log("\n=== BEGINNER LABS ===");
  for (const f of beginnerFlags) {
    let found = false;
    for (const c of f.candidates) {
      if (await bcrypt.compare(normalizeAnswer(c), f.hash)) {
        console.log(`PASS: ${f.title} = "${c}"`);
        found = true;
        break;
      }
    }
    if (!found) console.log(`FAIL: ${f.title} - tried [${f.candidates.join(', ')}]`);
  }
}
main();

export const SAMPLE = `let total = 0
let values = [1, 3, 4, 5]

each x from values
    gather x into total

require total == 13
expose "Result" total`;

const node=(kind,fields={})=>({kind,...fields});
const lit=value=>node('Lit',{value});
const ref=name=>node('Ref',{name});

function parseValue(raw){
  raw=raw.trim();
  if(/^[-+]?\d+$/.test(raw)) return lit(Number(raw));
  if(/^\[.*\]$/.test(raw)){
    let value;
    try{ value=JSON.parse(raw); }catch{ throw Error('invalid collection literal'); }
    if(!Array.isArray(value)||value.some(x=>!Number.isInteger(x))) throw Error('Kernel 0.1 collections must contain integers');
    return lit(value);
  }
  if(/^[A-Za-z_]\w*$/.test(raw)) return ref(raw);
  throw Error(`unsupported expression: ${raw}`);
}

export function parsePersonal(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const statements=[];
  for(let i=0;i<lines.length;){
    const line=lines[i].trim(); i++;
    if(!line||line.startsWith('#')) continue;
    let m;
    if((m=line.match(/^(?:let|nest)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/))){
      statements.push(node('Bind',{name:m[1],expr:parseValue(m[2])}));
      continue;
    }
    if((m=line.match(/^(?:each|orbit)\s+([A-Za-z_]\w*)\s+(?:from|across)\s+([A-Za-z_]\w*)$/))){
      const body=[];
      while(i<lines.length&&(/^\s{4}\S/.test(lines[i])||/^\t\S/.test(lines[i]))){
        const bodyLine=lines[i].trim(); i++;
        const u=bodyLine.match(/^(?:gather|meld)\s+([A-Za-z_]\w*)\s+(?:into|toward)\s+([A-Za-z_]\w*)$/);
        if(!u) throw Error(`unsupported loop statement: ${bodyLine}`);
        body.push(node('AddUpdate',{target:u[2],value:ref(u[1])}));
      }
      if(!body.length) throw Error('iterate requires an indented body');
      statements.push(node('Iterate',{binding:m[1],source:ref(m[2]),body}));
      continue;
    }
    if((m=line.match(/^(?:require|verify)\s+([A-Za-z_]\w*)\s*==\s*(-?\d+)$/))){
      statements.push(node('Assert',{condition:node('Eq',{left:ref(m[1]),right:lit(Number(m[2]))})}));
      continue;
    }
    if((m=line.match(/^(?:expose|beam)\s+"([^"]+)"\s+([A-Za-z_]\w*)$/))){
      statements.push(node('Observe',{label:m[1],value:ref(m[2])}));
      continue;
    }
    throw Error(`unsupported surface syntax: ${line}`);
  }
  return node('Program',{statements});
}

function typeOfLiteral(value){
  if(Number.isInteger(value)) return 'Int';
  if(typeof value==='boolean') return 'Bool';
  if(Array.isArray(value)&&value.every(Number.isInteger)) return 'Collection<Int>';
  return 'Unknown';
}

export function validateKernel(program){
  const globals=new Map();
  function exprType(expr,scope){
    if(expr.kind==='Lit') return typeOfLiteral(expr.value);
    if(expr.kind==='Ref'){
      if(!scope.has(expr.name)) throw Error(`UnboundReference(${expr.name})`);
      return scope.get(expr.name);
    }
    if(expr.kind==='Eq'){
      const left=exprType(expr.left,scope),right=exprType(expr.right,scope);
      if(left!==right) throw Error(`Eq type mismatch: ${left} vs ${right}`);
      return 'Bool';
    }
    throw Error(`undeclared expression ${expr.kind}`);
  }
  function statements(stmts,scope){
    for(const stmt of stmts){
      if(stmt.kind==='Bind'){
        scope.set(stmt.name,exprType(stmt.expr,scope));
      }else if(stmt.kind==='Iterate'){
        if(exprType(stmt.source,scope)!=='Collection<Int>') throw Error('Iterate source must be Collection<Int>');
        const child=new Map(scope);
        child.set(stmt.binding,'Int');
        statements(stmt.body,child);
      }else if(stmt.kind==='AddUpdate'){
        if(!scope.has(stmt.target)) throw Error(`UnboundReference(${stmt.target})`);
        if(scope.get(stmt.target)!=='Int'||exprType(stmt.value,scope)!=='Int') throw Error('AddUpdate requires Int target and Int value');
      }else if(stmt.kind==='Assert'){
        if(exprType(stmt.condition,scope)!=='Bool') throw Error('Assert requires Bool');
      }else if(stmt.kind==='Observe'){
        exprType(stmt.value,scope);
      }else{
        throw Error(`undeclared semantic operation ${stmt.kind}`);
      }
    }
  }
  statements(program.statements,globals);
  return true;
}

function sameValue(a,b){ return JSON.stringify(a)===JSON.stringify(b); }
function evalExpr(expr,store){
  if(expr.kind==='Lit') return structuredClone(expr.value);
  if(expr.kind==='Ref'){
    if(!store.has(expr.name)) throw Error(`UnboundReference(${expr.name})`);
    return store.get(expr.name);
  }
  if(expr.kind==='Eq') return sameValue(evalExpr(expr.left,store),evalExpr(expr.right,store));
  throw Error(`UnsupportedExpr(${expr.kind})`);
}

export function executeKernel(program){
  const store=new Map(),observations=[];
  function run(stmts){
    for(const stmt of stmts){
      if(stmt.kind==='Bind'){
        store.set(stmt.name,evalExpr(stmt.expr,store));
      }else if(stmt.kind==='Iterate'){
        const values=evalExpr(stmt.source,store);
        const had=store.has(stmt.binding),previous=store.get(stmt.binding);
        for(const value of values){
          store.set(stmt.binding,value);
          const failure=run(stmt.body);
          if(failure) return failure;
        }
        if(had) store.set(stmt.binding,previous); else store.delete(stmt.binding);
      }else if(stmt.kind==='AddUpdate'){
        const left=store.get(stmt.target),right=evalExpr(stmt.value,store);
        if(!Number.isInteger(left)||!Number.isInteger(right)) return {kind:'TypeError'};
        store.set(stmt.target,left+right);
      }else if(stmt.kind==='Assert'){
        if(!evalExpr(stmt.condition,store)) return {kind:'AssertionFailure'};
      }else if(stmt.kind==='Observe'){
        observations.push([stmt.label,evalExpr(stmt.value,store)]);
      }
    }
    return null;
  }
  const failure=run(program.statements);
  return {status:failure?'failure':'success',error:failure?.kind||null,store:Object.fromEntries(store),observations};
}

function pyExpr(expr){
  if(expr.kind==='Lit') return JSON.stringify(expr.value);
  if(expr.kind==='Ref') return expr.name;
  if(expr.kind==='Eq') return `${pyExpr(expr.left)} == ${pyExpr(expr.right)}`;
  throw Error(`cannot emit ${expr.kind}`);
}

export function emitPython(program){
  const out=[];
  function emit(stmts,depth=0){
    const pad='    '.repeat(depth);
    for(const stmt of stmts){
      if(stmt.kind==='Bind') out.push(`${pad}${stmt.name} = ${pyExpr(stmt.expr)}`);
      else if(stmt.kind==='Iterate'){
        out.push(`${pad}for ${stmt.binding} in ${pyExpr(stmt.source)}:`);
        emit(stmt.body,depth+1);
      }else if(stmt.kind==='AddUpdate') out.push(`${pad}${stmt.target} += ${pyExpr(stmt.value)}`);
      else if(stmt.kind==='Assert') out.push(`${pad}assert ${pyExpr(stmt.condition)}`);
      else if(stmt.kind==='Observe') out.push(`${pad}__observe__(${JSON.stringify(stmt.label)}, ${pyExpr(stmt.value)})`);
    }
  }
  emit(program.statements);
  return out.join('\n');
}

export function renderDialect(program,dialect='personal'){
  if(dialect==='personal') return renderPersonal(program);
  if(dialect!=='alien') throw Error(`unknown dialect ${dialect}`);
  const lines=[];
  for(const stmt of program.statements){
    if(stmt.kind==='Bind') lines.push(`nest ${stmt.name} = ${pyExpr(stmt.expr)}`);
    else if(stmt.kind==='Iterate'){
      lines.push(`orbit ${stmt.binding} across ${stmt.source.name}`);
      for(const body of stmt.body) lines.push(`    meld ${body.value.name} toward ${body.target}`);
    }else if(stmt.kind==='Assert') lines.push(`verify ${stmt.condition.left.name} == ${stmt.condition.right.value}`);
    else if(stmt.kind==='Observe') lines.push(`beam ${JSON.stringify(stmt.label)} ${stmt.value.name}`);
  }
  return lines.join('\n');
}

function renderPersonal(program){
  const lines=[];
  for(const stmt of program.statements){
    if(stmt.kind==='Bind') lines.push(`let ${stmt.name} = ${pyExpr(stmt.expr)}`);
    else if(stmt.kind==='Iterate'){
      lines.push(`each ${stmt.binding} from ${stmt.source.name}`);
      for(const body of stmt.body) lines.push(`    gather ${body.value.name} into ${body.target}`);
    }else if(stmt.kind==='Assert') lines.push(`require ${stmt.condition.left.name} == ${stmt.condition.right.value}`);
    else if(stmt.kind==='Observe') lines.push(`expose ${JSON.stringify(stmt.label)} ${stmt.value.name}`);
  }
  return lines.join('\n');
}

function canonical(value){
  if(Array.isArray(value)) return value.map(canonical);
  if(value&&typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort()) out[key]=canonical(value[key]);
    return out;
  }
  return value;
}
export const normalize=value=>JSON.stringify(canonical(value));

export function firstDiff(a,b,path='IR'){
  if(typeof a!==typeof b) return `${path}: type differs`;
  if(a===null||b===null||typeof a!=='object') return a===b?'':`${path}: expected ${JSON.stringify(a)}, observed ${JSON.stringify(b)}`;
  for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    if(!(key in a)) return `${path}.${key}: unexpected`;
    if(!(key in b)) return `${path}.${key}: missing`;
    const diff=firstDiff(a[key],b[key],`${path}.${key}`);
    if(diff) return diff;
  }
  return '';
}

export async function loadPython(){
  const mod=await import('https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.mjs');
  return mod.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.6/full/'});
}

export async function pythonSyntaxCheck(pyodide,source){
  pyodide.globals.set('__syntax_src__',source);
  try{
    await pyodide.runPythonAsync(`import ast\nast.parse(__syntax_src__, mode="exec")\nTrue`);
    return true;
  }finally{ try{pyodide.globals.delete('__syntax_src__')}catch{} }
}

export async function reconstructPython(pyodide,source){
  pyodide.globals.set('__reconstruct_src__',source);
  try{
    const raw=await pyodide.runPythonAsync(`
import ast, json
source=__reconstruct_src__

def expr(n):
    if isinstance(n, ast.Constant) and isinstance(n.value, bool):
        return {"kind":"Lit","value":n.value}
    if isinstance(n, ast.Constant) and isinstance(n.value, int):
        return {"kind":"Lit","value":n.value}
    if isinstance(n, ast.List):
        vals=[]
        for e in n.elts:
            if not isinstance(e, ast.Constant) or isinstance(e.value,bool) or not isinstance(e.value,int):
                raise ValueError("unsupported list element")
            vals.append(e.value)
        return {"kind":"Lit","value":vals}
    if isinstance(n, ast.Name):
        return {"kind":"Ref","name":n.id}
    if isinstance(n, ast.Compare) and len(n.ops)==1 and isinstance(n.ops[0],ast.Eq) and len(n.comparators)==1:
        return {"kind":"Eq","left":expr(n.left),"right":expr(n.comparators[0])}
    raise ValueError("unsupported expression: "+type(n).__name__)

def stmt(n):
    if isinstance(n, ast.Assign) and len(n.targets)==1 and isinstance(n.targets[0],ast.Name):
        return {"kind":"Bind","name":n.targets[0].id,"expr":expr(n.value)}
    if isinstance(n, ast.For) and isinstance(n.target,ast.Name) and not n.orelse:
        return {"kind":"Iterate","binding":n.target.id,"source":expr(n.iter),"body":[stmt(x) for x in n.body]}
    if isinstance(n, ast.AugAssign) and isinstance(n.target,ast.Name):
        if isinstance(n.op,ast.Add):
            return {"kind":"AddUpdate","target":n.target.id,"value":expr(n.value)}
        if isinstance(n.op,ast.Mult):
            return {"kind":"MultiplyUpdate","target":n.target.id,"value":expr(n.value)}
        return {"kind":"UnsupportedUpdate","operator":type(n.op).__name__,"target":n.target.id,"value":expr(n.value)}
    if isinstance(n, ast.Assert) and n.msg is None:
        return {"kind":"Assert","condition":expr(n.test)}
    if isinstance(n, ast.Expr) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Name) and n.value.func.id=="__observe__" and len(n.value.args)==2:
        label=n.value.args[0]
        if not isinstance(label,ast.Constant) or not isinstance(label.value,str):
            raise ValueError("observe label must be a string literal")
        return {"kind":"Observe","label":label.value,"value":expr(n.value.args[1])}
    raise ValueError("unsupported statement: "+type(n).__name__)

tree=ast.parse(source,mode="exec")
json.dumps({"kind":"Program","statements":[stmt(n) for n in tree.body]},sort_keys=True)
`);
    return JSON.parse(String(raw));
  }finally{ try{pyodide.globals.delete('__reconstruct_src__')}catch{} }
}

export async function executePython(pyodide,source){
  pyodide.globals.set('__execute_src__',source);
  try{
    const raw=await pyodide.runPythonAsync(`
import json
observations=[]
def __observe__(label,value): observations.append([label,value])
ns={"__observe__":__observe__}
status="success"; error=None
try:
    exec(compile(__execute_src__,"<projection>","exec"),ns,ns)
except AssertionError:
    status="failure"; error="AssertionFailure"
except Exception as exc:
    status="failure"; error=type(exc).__name__
public={k:v for k,v in ns.items() if not k.startswith("__") and isinstance(v,(int,bool,list))}
json.dumps({"status":status,"error":error,"store":public,"observations":observations},sort_keys=True)
`);
    return JSON.parse(String(raw));
  }finally{ try{pyodide.globals.delete('__execute_src__')}catch{} }
}

export async function verifyProjection(pyodide,personalSource,pythonSource){
  const result={stages:[],personalSource,pythonSource,irA:null,irB:null,reference:null,target:null,highest:-1};
  const stage=(level,status,detail)=>{result.stages.push({level,status,detail});if(status==='pass')result.highest=Math.max(result.highest,level);};
  try{result.irA=parsePersonal(personalSource);stage(0,'pass','surface elaborated');}catch(e){stage(0,'fail',e.message);return result;}
  try{validateKernel(result.irA);stage(1,'pass','Kernel 0.1 admitted');}catch(e){stage(1,'fail',e.message);return result;}
  result.reference=executeKernel(result.irA);
  try{await pythonSyntaxCheck(pyodide,pythonSource);stage(2,'pass','CPython ast.parse accepted target');}catch(e){stage(2,'fail',String(e.message||e));return result;}
  try{result.irB=await reconstructPython(pyodide,pythonSource);}catch(e){stage(3,'fail',`semantic reader refused target: ${e.message||e}`);return result;}
  const equivalent=normalize(result.irA)===normalize(result.irB);
  if(!equivalent){stage(3,'fail',firstDiff(result.irA,result.irB));return result;}
  stage(3,'pass','independent reconstruction equals canonical IR');
  result.target=await executePython(pyodide,pythonSource);
  const sameFailure=result.reference.status===result.target.status&&result.reference.error===result.target.error;
  const sameObservations=normalize(result.reference.observations)===normalize(result.target.observations);
  if(!sameFailure||!sameObservations){stage(4,'fail','reference and target observations/failure class diverge');return result;}
  if(result.reference.status==='failure'){
    result.stages.push({level:4,status:'agreed-failure',detail:`both executions report ${result.reference.error}`});
    return result;
  }
  stage(4,'pass','declared observations and failure class agree');
  return result;
}

export function generatedPython(personalSource){
  const ir=parsePersonal(personalSource);
  validateKernel(ir);
  return emitPython(ir);
}

export async function runDefeatSuite(pyodide){
  const basePython=generatedPython(SAMPLE);
  const cases=[];
  async function add(name,personalSource,pythonSource,predicate,expectation){
    const result=await verifyProjection(pyodide,personalSource,pythonSource);
    cases.push({name,pass:predicate(result),expectation,result});
  }
  await add('happy path',SAMPLE,basePython,r=>r.stages.some(s=>s.level===4&&s.status==='pass'),'S4 pass');
  await add('ADD → MUL',SAMPLE,basePython.replace('total += x','total *= x'),r=>r.stages.some(s=>s.level===2&&s.status==='pass')&&r.stages.some(s=>s.level===3&&s.status==='fail'),'S2 pass; S3 fail');
  await add('rename update target',SAMPLE,basePython.replace('total += x','other += x'),r=>r.stages.some(s=>s.level===2&&s.status==='pass')&&r.stages.some(s=>s.level===3&&s.status==='fail'),'S2 pass; S3 fail');
  await add('invalid Python syntax',SAMPLE,basePython.replace('for x in values:','for x values:'),r=>r.stages.some(s=>s.level===2&&s.status==='fail'),'S2 fail');
  const falsePersonal=SAMPLE.replace('require total == 13','require total == 999');
  const falsePython=generatedPython(falsePersonal);
  await add('false invariant',falsePersonal,falsePython,r=>r.stages.some(s=>s.level===3&&s.status==='pass')&&r.stages.some(s=>s.level===4&&s.status==='agreed-failure'),'S0–S3 pass; S4 agreed AssertionFailure');
  const undeclared=SAMPLE.replace('gather x into total','multiply x into total');
  await add('undeclared personal operation',undeclared,basePython,r=>r.stages.some(s=>s.level===0&&s.status==='fail')||r.stages.some(s=>s.level===1&&s.status==='fail'),'refused by S1 or earlier');
  return {pass:cases.every(c=>c.pass),cases};
}

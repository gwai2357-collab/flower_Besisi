// 화면 등록과 이동. 화면 하나 = src/screens/ 안의 파일 하나.
//   export default { id:'send-1-flowers', flow:'send', title:'꽃 꾸미기', mount(ctx){ ...; return cleanup } }
//   ctx: { root(#screen), stage, go, back, params, flow }
export const registry = new Map();
export const register = def => registry.set(def.id, def);
const history = []; let cleanup = null, ctxBase = null, onChange = () => {};

export function init(base, cb){ ctxBase = base; onChange = cb || onChange; }
export function go(id, params = {}, { replace = false } = {}){
  const def = registry.get(id); if (!def){ console.warn('없는 화면:', id); return; }
  if (cleanup){ try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  if (replace) history.pop();
  history.push({ id, params });
  const root = ctxBase.root; root.replaceChildren(); root.className = 'flow-' + def.flow;
  ctxBase.stage.setInset(0); ctxBase.stage.controls.enabled = true;
  cleanup = def.mount({ ...ctxBase, params, go, back, flow: def.flow, def }) || null;
  onChange(def, history.length > 1);
}
export function back(){
  if (history.length < 2) return;
  history.pop(); const prev = history.pop(); go(prev.id, prev.params);
}
export const current = () => history[history.length - 1];

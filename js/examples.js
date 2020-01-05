var basic_ex = 
  '(λx.x + x + 1) 2'

var dfg_ex = 
  '(λx.λy.(x + x) + (y + y)) (deref (ref 0)) 2'

var link_ex = 
  'let c = ref 0 in\n'
+ 'let _ = (λx.λy.(x +x)+(y +y)) (deref c) 2 in\n'
+ 'link c (ref 1)'

var max_ex = 
  'let max = λx.λy.if x <= y then y else x in\n'
+ '\n'
+ 'let x = ref 1 in\n'
+ 'let y = ref 2 in\n'
+ 'let m = max (deref x) (deref y) in\n'
+ 'step;\n'
+ 'link x 3;\n'
+ 'step;\n'
+ 'm';

var fir_ex = 
  'let nil = 0 in\n' 
+ 'let fir = λx. λfs.\n' 
+ '  let aux = rec g. λx. λsum. λfs.\n' 
+ '    if fs <= nil\n' 
+ '    then \n' 
+ '      sum\n' 
+ '    else \n' 
+ '      let (f, fs) = fs in \n' 
+ '      g (deref (ref x)) (f x + sum) fs\n' 
+ '  in\n' 
+ '  aux x 0 fs\n' 
+ 'in \n' 
+ '\n' 
+ 'let avg3 = λx. \n' 
+ '   let w = λx. x / 3 in \n' 
+ '   let fs = (w, (w, (w, nil))) in\n' 
+ '   fir x fs\n' 
+ 'in\n' 
+ '\n' 
+ 'let inp = ref 0 in \n' 
+ 'link inp ((deref inp) + 1); \n' 
+ 'let y = avg3 (deref inp) in\n' 
+ 'step; \n' 
+ 'step; \n' 
+ 'step; \n' 
+ 'peek y\n' 

var alt_sum_ex = 
  'let sm = λi.λf.λx. \n'
+ '  let s = ref i in \n'
+ '  link s (f s x); \n'
+ '  deref s \n'
+ 'in \n'
+ '\n'
+ 'let alt = sm 1 (λs.λi.1 - (deref s)) 0 in \n'
+ 'let sum = λx. sm 1 (λs.λi.i + (deref s)) x in \n'
+ 'let alt_sum = sum alt in \n'
+ 'step; \n'
+ 'step; \n'
+ 'peek alt_sum';
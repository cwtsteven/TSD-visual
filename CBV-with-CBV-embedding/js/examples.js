var fact = 
  'let fact = rec f. λx.\n'
+ '  if (x <= 1)\n'
+ '  then 1\n'
+ '  else (x * (f (x - 1)))\n'
+ 'in\n'
+ '\n'
+ 'fact 4';

var prov = 
  'let x = {1} in\n'
+ 'let y = {x + 2} in\n'
+ 'let _ = set x to 3 in\n'
+ 'let _ = prop in\n'
+ 'y'

var circular = 
  'let x = {1} in\n'
+ 'let _ = set x to (x + 1) in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'x'

var batch_update = 
  'let x = {1} in\n'
+ 'let y = {2} in\n'
+ 'let m = {x + 3} in\n'
+ 'let n = {y + 4} in\n'
+ 'let z = {m + n} + {m + n} in\n'
+ 'let _ = set x to 5 in\n'
+ 'let _ = set y to 6 in\n'
+ 'let _ = prop in\n'
+ 'z'

var if_then_else = 
  'let x = {1} in\n'
+ 'let y = if x <= 1 then {2} else {3} in\n'
+ 'let _ = set y to 4 in\n'
+ 'let _ = set x to 2 in\n'
+ 'let _ = prop in\n'
+ 'let _ = set y to 5 in\n'
+ 'let _ = prop in\n'
+ 'y'

var newton_method = 
  'let f = λx. 4*x*x*x + 3*x*x + 2*x + 1 in\n'
+ 'let f\' = λx. 12*x*x + 6*x + 2 in\n'
+ 'let x = {1} in\n'
+ 'let _ = set x to x - (f x) / (f\' x) in\n'
+ '\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ 'let _ = prop in\n'
+ '\n'
+ 'x\n'
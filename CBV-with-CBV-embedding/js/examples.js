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
+ 'let y = x + 2 in\n'
+ 'let _ = set x to 3 in\n'
+ 'let n = prop in\n'
+ 'y'

var circular = 
  'let x = {1} in\n'
+ 'let _ = set x to (x + 1) in\n'
+ 'let n = prop in\n'
+ 'let n = prop in\n'
+ 'let n = prop in\n'
+ 'x'

var batch_update = 
  'let x = {1} in\n'
+ 'let y = {2} in\n'
+ 'let m = x + 3 in\n'
+ 'let n = y + 4 in\n'
+ 'let z = m + n in\n'
+ 'let _ = set x to 5 in\n'
+ 'let _ = set y to 6 in\n'
+ 'let n = prop in\n'
+ 'z'

var fact_inc = 
  'let fact = rec f. λx.\n'
+ '  let y = x <= 1 in\n'
+ '    if y\n'
+ '    then 1\n'
+ '    else (x * (f (x - 1)))\n'
+ 'in\n'
+ '\n'
+ 'let x = {3} in\n'
+ 'let m = fact x in\n'
+ 'let _ = set x to 2 in\n'
+ 'let n = prop in\n'
+ 'm'
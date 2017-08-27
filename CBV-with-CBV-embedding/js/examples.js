var fact = 
  'let fact = rec(f,x).\n'
+ '  if (x <= 1)\n'
+ '  then 1\n'
+ '  else (x * (f (x - 1)))\n'
+ 'in\n'
+ '\n'
+ 'fact 4';

var prov = 
  'let x = {1} in\n'
+ 'let y = x + 2 in\n'
+ '(set x to 3);\n'
+ 'prop;\n'
+ 'y'

var prop_within_fun = 
  'let x = {1} in\n'
+ 'let f = {λy. ((set x to y);prop;x + y)} in\n'
+ 'f 3'

var effect_order = 
  'let x = {1} in\n'
+ 'let f = {λy. ((set x to y);x + y)} in\n'
+ 'let m = (f 2) + (f 3) in\n'
+ '(set x to 4);\n'
+ 'prop;\n'
+ 'm'

var concurrent_prop = 
  'let x = {1} in\n'
+ 'let f = {λy.x+y} in\n'
+ 'let m = (f x) + (f 2) + (f 3) in\n'
+ '(set x to 2);\n'
+ 'prop;\n'
+ 'm'

var circular = 
  'let x = {1} in\n'
+ '(set x to (x + 1));\n'
+ 'prop;\n'
+ 'prop;\n'
+ 'prop;\n'
+ 'x'

var batch_update = 
  'let x = {1} in\n'
+ 'let y = {2} in\n'
+ 'let m = x + 3 in\n'
+ 'let n = y + 4 in\n'
+ 'let z = m + n in\n'
+ '(set x to 5);\n'
+ '(set y to 6);\n'
+ 'prop;\n'
+ 'z'

var fact_inc = 
  'let fact = rec(f,x).\n'
+ '  let y = x <= 1 in\n'
+ '    if y\n'
+ '    then 1\n'
+ '    else (x * (f (x - 1)))\n'
+ 'in\n'
+ '\n'
+ 'let x = {3} in\n'
+ 'let m = fact x in\n'
+ '(set x to 2);\n'
+ 'prop;\n'
+ 'm'

var if_inc = 
  'let x = {1} in\n'
+ 'let f = if (x <= 2) then (λx.x) else (λx.x+1) in\n'
+ 'let m = f 3 in\n'
+ '(set x to 4);\n'
+ 'prop;\n'
+ 'm'
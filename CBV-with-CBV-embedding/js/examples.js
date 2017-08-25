var fact_prog = 
  'let fact = rec(f,x).\n'
+ '  if (x <= 1)\n'
+ '  then 1\n'
+ '  else (x * (f (x - 1)))\n'
+ 'in\n'
+ '\n'
+ 'fact 4';

var prov_prog = 
  'let x = {1} in\n'
+ 'let y = x + 2 in\n'
+ '(set x to 3);\n'
+ 'prop;\n'
+ 'y'

var change_withn_fun_prog =
  'let x = {1} in\n'
+ 'let y = {2} in\n'
+ 'let f = {λz. x + ((set x to y); z) + y} in\n'
+ 'let m = (f 3) + (f 4) in\n'
+ 'prop;\n'
+ 'prop;\n'
+ 'm'

var prop_within_fun_prog = 
  'let x = {1} in\n'
+ 'let f = {λy. ((set x to y);prop; x + y)} in\n'
+ 'f 3'

var concurrent_prop_prog = 
  'let x = {1} in\n'
+ 'let f = {λy.x+y} in\n'
+ 'let m = (f x) + (f x) in\n'
+ '(set x to 2);\n'
+ 'prop;\n'
+ 'm'

var circular_prog = 
  'let x = {1} in\n'
+ '(set x to (x + 1));\n'
+ 'prop;\n'
+ 'prop;\n'
+ 'prop;\n'
+ 'x'

var batch_update_prog = 
  'let x = {1} in\n'
+ 'let y = {2} in\n'
+ 'let m = x + 3 in\n'
+ 'let n = y + 4 in\n'
+ 'let z = m + n in\n'
+ '(set x to 5);\n'
+ '(set y to 6);\n'
+ 'prop;\n'
+ 'z'

var effect_order_prog = 
  'let x = {1} in\n'
+ 'let f = {λy. ((set x to y); x + y)} in\n'
+ 'let m = (f 3) + (f 4) in\n'
+ 'prop;\n'
+ 'm'